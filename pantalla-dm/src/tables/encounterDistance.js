export const encounterDistance = () => {
  const encounterDistance = document.createElement('article');
  encounterDistance.classList.add('card');
  encounterDistance.innerHTML = `
    <h2>Distancia de encuentro</h2>
    <table>
      <thead>
        <tr>
          <th>Terreno</th>
          <th>Distancia</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Ártico, desierto, cultivos o pradera</td>
          <td>6d6 x 10 pies</td>
        </tr>
        <tr>
          <td>Bosque, pantano o arboleda</td>
          <td>2d8 x 10 pies</td>
        </tr>
        <tr>
          <td>Colinas o yermos</td>
          <td>2d10 x 10 pies</td>
        </tr>
        <tr>
          <td>Selva</td>
          <td>2d6 x 10 pies</td>
        </tr>
        <tr>
          <td>Montañas</td>
          <td>4d10 x 10 pies</td>
        </tr>
        <tr>
          <td>Subterráneo o urbano</td>
          <td>2d4 x 10 pies</td>
        </tr>
      </tbody>
    </table>
  `;
  return encounterDistance;
};
