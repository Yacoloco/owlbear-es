export const thingsYouCanDo = () => {
  const thingsYouCanDo = document.createElement('article');
  thingsYouCanDo.classList.add('card');
  thingsYouCanDo.innerHTML = `
    <h2>Qué podés hacer en tu turno</h2>
    <div class="block">
      <ul>
        <li>Moverte hasta tu velocidad.</li>
        <li>Realizar una acción.</li>
        <li>Comunicarte hablando, con gestos o ambas cosas.</li>
        <li>Interactuar con un objeto o elemento del entorno mientras te movés o actuás. Para un segundo objeto, usá la acción Usar un objeto.</li>
      </ul>
    </div>
  `;
  return thingsYouCanDo;
}