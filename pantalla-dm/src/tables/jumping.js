export const jumping = () => {
  const jumping = document.createElement('article');
  jumping.classList.add('card');
  jumping.innerHTML = `
    <h2>Saltar</h2>
    <div class="block">
      <h4>Salto de longitud</h4>
      <p>Con 10 pies o más de carrerilla, saltás tantos pies como tu puntuación de Fuerza. Sin carrerilla, solo la mitad.</p>
    </div>
    <div class="block">
      <h4>Salto de altura</h4>
      <p>Con 10 pies o más de carrerilla, saltás 3 + tu modificador de Fuerza en pies. Sin carrerilla, solo la mitad.</p>
    </div>  
   
  `;
  return jumping;
};
