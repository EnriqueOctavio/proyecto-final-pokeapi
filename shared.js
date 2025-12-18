/* Esto es para los tags
const buttonTag = document.querySelectorAll('.button-tag');

buttonTag.forEach((button) => {
  button.addEventListener('click', () => {
    buttonTag.forEach((btn) => btn.classList.remove("button-tag--active"));
    button.classList.add("button-tag--active");
  });
}); */


// Captando todo lo necesario para el manejo de las tags
const buttonContainer = document.querySelector('.buttons-tag-container');
const buttonTag = document.querySelectorAll('.button-tag')
const panels = document.querySelectorAll('[data-view-panel]')
const tituloPrincipal = document.getElementById('titulo-principal');

const titulos = {
  buscar: 'Pokémon Finder',
  historico: '📜 Histórico',
  vs: '⚔️ VS',
  favoritos: '❤️ Favoritos'
};

panels.forEach((panel) => { //Esto lo hice para mostrar el panel de buscar primero
    const vistaPanel = panel.dataset.viewPanel;
    panel.hidden = vistaPanel !== 'buscar';
})

// Aca gestiono detecto el botón exacto que hice clic para mostrar el panel que le corresponde
buttonContainer.addEventListener('click', (event) => { 
  const button = event.target.closest('.button-tag');
  if (!button) return;

  const vistaButton = button.dataset.view;

  buttonTag.forEach((btn) => btn.classList.remove('button-tag--active'));
  button.classList.add('button-tag--active');

  panels.forEach((panel) => {
    const vistaPanel = panel.dataset.viewPanel;
    panel.hidden = vistaPanel !== vistaButton;
  });

  tituloPrincipal.textContent = titulos[vistaButton];
});

// Html dentro de otro html como si fuesen componentes

// para la terminar 
// cd C:\Users\engonzalez\Desktop\pokeapi  
// npx serve 
// Nota: No basta con solo abrir el index.html

async function cargarComponente(idContenedor, urlArchivo) {
  const contenedor = document.getElementById(idContenedor);
  const respuestaHtml = await fetch(urlArchivo);
  const html = await respuestaHtml.text();
  contenedor.innerHTML = html;
  
  // Ejecutar los scripts que vienen en el componente
  const scripts = contenedor.querySelectorAll('script');
  scripts.forEach(script => {
    const nuevoScript = document.createElement('script');
    nuevoScript.textContent = script.textContent;
    script.remove();
    document.body.appendChild(nuevoScript);
  });
}

cargarComponente('historico-section', 'historico.html');
cargarComponente('vs-section', 'vs.html');
cargarComponente('favoritos-section', 'favoritos.html');
