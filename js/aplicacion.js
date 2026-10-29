'use strict';

class CalculadoraMateriales {
  static calcular(tipo, formulario) {
    const valor = (id) => Number(formulario.querySelector(`#${id}`).value);

    switch (tipo) {
      case 'area': {
        const area = valor('largo') * valor('alto');
        return {
          nombre: 'Área aproximada (medidas en metros)',
          resultado: area,
          unidad: 'm²'
        };
      }
      case 'volumen': {
        const volumen = (valor('grosor') / 100) * valor('largo') * valor('alto');
        return {
          nombre: 'Volumen de concreto (grosor en cm; largo y alto en m)',
          resultado: volumen,
          unidad: 'm³'
        };
      }
      case 'pintura': {
        const litros = valor('superficie') / 10;
        return {
          nombre: 'Pintura aproximada (una capa, 10 m² por litro)',
          resultado: litros,
          unidad: 'L'
        };
      }
      case 'piso': {
        const volumen = (valor('grosor') / 100) * valor('largo');
        return {
          nombre: 'Volumen por cada metro de ancho (grosor en cm; largo en m)',
          resultado: volumen,
          unidad: 'm³'
        };
      }
      case 'muro': {
        const area = valor('largo') * valor('alto');
        const espesor = Number(formulario.querySelector('input[name="espesor"]:checked').value);
        const ladrillosPorMetro = espesor === 30 ? 40 : 25;
        return {
          nombre: `Ladrillos aproximados para ${area.toFixed(2)} m² de muro`,
          resultado: Math.ceil(area * ladrillosPorMetro),
          unidad: 'ladrillos'
        };
      }
      default:
        return null;
    }
  }
}

function iniciarCalculadoras() {
  document.querySelectorAll('[data-calculator]').forEach((formulario) => {
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();

      const campos = Array.from(formulario.querySelectorAll('input[type="number"]'));
      if (campos.some((campo) => !Number.isFinite(Number(campo.value)) || Number(campo.value) <= 0)) {
        window.alert('Ingresa valores mayores que cero en todos los campos.');
        return;
      }

      const calculo = CalculadoraMateriales.calcular(formulario.dataset.calculator, formulario);
      if (!calculo || !Number.isFinite(calculo.resultado)) {
        window.alert('No fue posible realizar el cálculo con esos datos.');
        return;
      }

      const parametros = new URLSearchParams({
        nombre: calculo.nombre,
        resultado: String(calculo.resultado),
        unidad: calculo.unidad
      });
      window.location.href = `Resultado.html?${parametros.toString()}`;
    });
  });
}

function leerListaLocal(clave) {
  const guardado = localStorage.getItem(clave);
  if (!guardado) {
    return [];
  }

  const lista = JSON.parse(guardado);
  if (!Array.isArray(lista)) {
    throw new Error('Los datos guardados no tienen el formato esperado.');
  }
  return lista;
}

function crearSalContrasena() {
  if (!window.crypto || !window.crypto.getRandomValues || !window.crypto.subtle) {
    throw new Error('El navegador no admite el cifrado necesario. Abre el sitio en localhost o HTTPS.');
  }
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function calcularHashContrasena(contrasena, sal) {
  const bytesSal = new Uint8Array(sal.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
  const clave = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const resultado = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bytesSal, iterations: 150000, hash: 'SHA-256' },
    clave,
    256
  );
  return Array.from(new Uint8Array(resultado), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hashesCoinciden(hashGuardado, hashIngresado) {
  if (hashGuardado.length !== hashIngresado.length) {
    return false;
  }

  let diferencia = 0;
  for (let indice = 0; indice < hashGuardado.length; indice += 1) {
    diferencia |= hashGuardado.charCodeAt(indice) ^ hashIngresado.charCodeAt(indice);
  }
  return diferencia === 0;
}

function iniciarFormularios() {
  const registro = document.querySelector('[data-form="registro"]');
  if (registro) {
    registro.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      try {
        const nombre = registro.elements.nombre.value.trim();
        const email = registro.elements.email.value.trim().toLowerCase();
        const cuentas = leerListaLocal('cuentasUsuarios');
        const existe = cuentas.some((cuenta) =>
          cuenta.email === email || cuenta.nombre.toLowerCase() === nombre.toLowerCase()
        );
        if (existe) {
          window.alert('Ese nombre o correo ya está registrado en este navegador.');
          return;
        }

        const sal = crearSalContrasena();
        const hash = await calcularHashContrasena(registro.elements.contrasena.value, sal);
        cuentas.push({ nombre, email, sal, hash });
        localStorage.setItem('cuentasUsuarios', JSON.stringify(cuentas));
        window.alert('Cuenta guardada en este navegador. Ahora puedes iniciar sesión.');
        window.location.href = 'Inicio de sesion.html';
      } catch (error) {
        window.alert(`No se pudo guardar la cuenta: ${error.message}`);
      }
    });
  }

  const login = document.querySelector('[data-form="login"]');
  if (login) {
    login.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      try {
        const identificador = login.elements.usuario.value.trim().toLowerCase();
        const cuentas = leerListaLocal('cuentasUsuarios');
        const cuenta = cuentas.find((usuario) =>
          usuario.email === identificador || usuario.nombre.toLowerCase() === identificador
        );
        if (!cuenta) {
          window.alert('Usuario o contraseña incorrectos.');
          return;
        }

        const hash = await calcularHashContrasena(login.elements.contrasena.value, cuenta.sal);
        if (!hashesCoinciden(cuenta.hash, hash)) {
          window.alert('Usuario o contraseña incorrectos.');
          return;
        }

        const accesos = leerListaLocal('registroAccesos');
        accesos.push({
          nombre: cuenta.nombre,
          email: cuenta.email,
          fecha: new Date().toISOString()
        });
        localStorage.setItem('registroAccesos', JSON.stringify(accesos));
        localStorage.setItem('nombreUsuario', cuenta.nombre);
        window.location.href = 'menu-calculadora.html';
      } catch (error) {
        window.alert(`No se pudo iniciar sesión: ${error.message}`);
      }
    });
  }

  const recuperar = document.querySelector('[data-form="recuperar"]');
  if (recuperar) {
    recuperar.addEventListener('submit', (evento) => {
      evento.preventDefault();
      window.alert('Esta página todavía no está conectada a un servicio para enviar correos.');
    });
  }
}

function iniciarMenu() {
  const saludo = document.querySelector('#saludo');
  if (saludo) {
    const nombre = localStorage.getItem('nombreUsuario') || 'usuario';
    saludo.textContent = `Hola, ${nombre}`;
  }

  document.querySelectorAll('[data-salir]').forEach((boton) => {
    boton.addEventListener('click', () => {
      localStorage.removeItem('nombreUsuario');
      window.location.href = 'Inicio de sesion.html';
    });
  });

  document.querySelectorAll('[data-exportar-registro]').forEach((boton) => {
    boton.addEventListener('click', () => {
      try {
        const accesos = leerListaLocal('registroAccesos');
        if (accesos.length === 0) {
          window.alert('Todavía no hay inicios de sesión registrados.');
          return;
        }

        const protegerCelda = (valor) => {
          let texto = String(valor);
          if (/^[\s]*[=+\-@]/.test(texto)) {
            texto = `'${texto}`;
          }
          return `"${texto.replace(/"/g, '""')}"`;
        };
        const filas = [
          ['Usuario', 'Correo', 'Fecha de inicio de sesión'],
          ...accesos.map((acceso) => [acceso.nombre, acceso.email, acceso.fecha])
        ];
        const contenido = `\uFEFF${filas.map((fila) => fila.map(protegerCelda).join(',')).join('\r\n')}`;
        const archivo = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
        const enlace = document.createElement('a');
        const direccion = URL.createObjectURL(archivo);
        enlace.href = direccion;
        enlace.download = 'registro_accesos.csv';
        enlace.click();
        URL.revokeObjectURL(direccion);
      } catch (error) {
        window.alert(`No se pudo exportar el registro: ${error.message}`);
      }
    });
  });
}

function mostrarResultado() {
  const valor = document.querySelector('#valor-resultado');
  const nombre = document.querySelector('#nombre-resultado');
  if (!valor || !nombre) {
    return;
  }

  const parametros = new URLSearchParams(window.location.search);
  const resultado = Number(parametros.get('resultado'));
  if (!Number.isFinite(resultado) || !parametros.has('nombre')) {
    nombre.textContent = 'No se recibió ningún cálculo';
    valor.textContent = '—';
    return;
  }

  nombre.textContent = parametros.get('nombre');
  const formato = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
  valor.textContent = `${formato.format(resultado)} ${parametros.get('unidad') || ''}`.trim();
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarCalculadoras();
  iniciarFormularios();
  iniciarMenu();
  mostrarResultado();
});
