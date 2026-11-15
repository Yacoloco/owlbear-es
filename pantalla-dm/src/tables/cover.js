export const cover = () => {
  const cover = document.createElement('article');
  cover.classList.add('card');
  cover.innerHTML = `
    <h2>Cobertura</h2>
    <table>
      <thead>
        <tr>
          <th class="text">Cobertura</th>
          <th>Efecto</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cobertura media</td>
          <td class="text">+2 a la CA y a las tiradas de salvación de Destreza</td>
        </tr>
        <tr>
          <td>Cobertura de tres cuartos</td>
          <td class="text">+5 a la CA y a las tiradas de salvación de Destreza</td>
        </tr>
        <tr>
          <td>Cobertura total</td>
          <td class="text">No puede ser objetivo directo de un ataque o conjuro</td>
        </tr>
      </tbody>
    </table>
  `;
  return cover;
};
