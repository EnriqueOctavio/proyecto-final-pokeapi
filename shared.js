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
});




