export const trackingDC = () => {
  const trackingDC = document.createElement('article');
  trackingDC.classList.add('card');
  trackingDC.innerHTML = `
    <h2>CD para rastrear</h2>
    <table>
      <thead>
        <tr>
          <th class="text">Tipo de suelo</th>
          <th>CD</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Superficie blanda, como nieve</td>
          <td>10</td>
        </tr>
        <tr>
          <td>Tierra o pasto</td>
          <td>15</td>
        </tr>
        <tr>
          <td>Piedra desnuda</td>
          <td>20</td>
        </tr>
        <tr>
          <td>Cada día desde que pasó la criatura</td>
          <td>+5</td>
        </tr>
        <tr>
          <td>La criatura dejó un rastro, como sangre</td>
          <td>-5</td>
        </tr>
      </tbody>
    </table>
  `;
  return trackingDC;
};
