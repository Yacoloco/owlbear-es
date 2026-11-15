export const damageSeverity = () => {
  const damageSeverity = document.createElement('article');
  damageSeverity.classList.add('card');
  damageSeverity.innerHTML = `
    <h2>Gravedad del daño</h2>
    <table>
      <thead>
        <tr>
          <th>Nivel</th>
          <th>Contratiempo</th>
          <th>Peligroso</th>
          <th>Mortal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1-4</td>
          <td>1d10</td>
          <td>2d10</td>
          <td>4d10</td> 
        </tr>
        <tr>
          <td>5-10</td>
          <td>2d10</td>
          <td>4d10</td>
          <td>10d10</td>
        </tr>
        <tr>
          <td>11-16</td>
          <td>4d10</td>
          <td>10d10</td>
          <td>18d10</td>
        </tr>
        <tr>
          <td>17-20</td>
          <td>10d10</td>
          <td>18d10</td>
          <td>24d10</td>
        </tr>
      </tbody>
    </table>
  `;
  return damageSeverity;
};
