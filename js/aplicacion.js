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

function iniciarFormularios() {
  const registro = document.querySelector('[data-form="registro"]');
  if (registro) {
    registro.addEventListener('submit', (evento) => {
      evento.preventDefault();
      localStorage.setItem('nombreUsuario', registro.elements.nombre.value.trim());
      window.location.href = 'Inicio de sesion.html';
    });
  }

  const login = document.querySelector('[data-form="login"]');
  if (login) {
    login.addEventListener('submit', (evento) => {
      evento.preventDefault();
      localStorage.setItem('nombreUsuario', login.elements.usuario.value.trim());
      window.location.href = 'menu-calculadora.html';
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
