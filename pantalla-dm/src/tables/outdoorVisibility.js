export const outdoorVisibility = () => {
  const outdoorVisibility = document.createElement('article');
  outdoorVisibility.classList.add('card');
  outdoorVisibility.innerHTML = `
    <h2>Visibilidad (exteriores)</h2>
    <table>
      <thead>
        <tr>
          <th class="text">Condición</th>
          <th>Distancia</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Día despejado, sin obstáculos</td>
          <td>2 millas</td>
        </tr>
        <tr>
          <td>Lluvia</td>
          <td>1 milla</td>
        </tr>
        <tr>
          <td>Niebla</td>
          <td>100-300 pies</td>
        </tr>
        <tr>
          <td>Desde altura</td>
          <td>x20</td>
        </tr>
      </tbody>
    </table>
  `;
  return outdoorVisibility;
};
