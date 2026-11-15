export const audibleDistance = () => {
  const audibleDistance = document.createElement('article');
  audibleDistance.classList.add('card');
  audibleDistance.innerHTML = `
    <h2>Distancia audible</h2>
    <table>
      <thead>
        <tr>
          <th class="text">Descripción</th>
          <th>Distancia</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Intentando no hacer ruido</td>
          <td>2d6 x 5 pies</td>
        </tr>
        <tr>
          <td>Ruido normal</td>
          <td>2d6 x 10 pies</td>
        </tr>
        <tr>
          <td>Mucho ruido</td>
          <td>2d6 x 50 pies</td>
        </tr>
      </tbody>
    </table>
  `;
  return audibleDistance;
};
