export const objectHP = () => {
  const objectHP = document.createElement('article');
  objectHP.classList.add('card');
  objectHP.innerHTML = `
    <h2>PG de objetos</h2>
    <table>
      <thead>
        <tr>
          <th class="text">Tamaño</th>
          <th>Frágil</th>
          <th>Resistente</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Diminuto (botella, cerradura)</td>
          <td>2 (1d4)</td>
          <td>5 (2d4)</td>
        </tr>
        <tr>
          <td>Pequeño (cofre, laúd)</td>
          <td>3 (1d6)</td>
          <td>10 (3d6)</td>
        </tr>
        <tr>
          <td>Mediano (barril, candelabro)</td>
          <td>4 (1d8)</td>
          <td>18 (4d8)</td>
        </tr>
        <tr>
          <td>Grande (carro, ventanal de 10x10 pies)</td>
          <td>5 (1d10)</td>
          <td>27 (5d10)</td>
        </tr>
        <tr>
          <td>Enorme (bote, estatua)</td>
          <td>6 (1d12)</td>
          <td>40 (6d12)</td>
        </tr>
        <tr>
          <td>Gargantuesco (velero, muralla)</td>
          <td>7 (2d6)</td>
          <td>50 (7d10)</td>
        </tr>
      </tbody>
    </table>
  `;
  return objectHP;
};
