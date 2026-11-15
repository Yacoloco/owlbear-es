export const concentration = () => {
  const concentration = document.createElement('article');
  concentration.classList.add('card');
  concentration.innerHTML = `
    <h2>Concentración</h2>
    <div class="block">
      <p>Si un conjuro requiere concentración, su descripción indica cuánto tiempo podés mantenerla. Podés terminar la concentración cuando quieras (no requiere acción). Estas situaciones la pueden romper:<p>
      <ul>
        <li>Empezás a lanzar otro conjuro que requiere concentración.</li>
        <li>Recibís daño. Para mantener la concentración, <span class="highlight">superá una tirada de salvación de Constitución con CD 10 o la mitad del daño recibido, lo que sea mayor.</span></li>
        <li>Quedás incapacitado o morís.</li>
        <li>Te abruma una distracción enorme, como una ola que te golpea. <span class="highlight">Superá una tirada de salvación de Constitución CD 10 para mantener la concentración.</span></li>
      </ul>
    </div>   
  `;
  return concentration;
};
