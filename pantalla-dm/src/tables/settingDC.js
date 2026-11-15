export const settingDC = () => {
  const settingDC = document.createElement('article');
  settingDC.classList.add('card');
  settingDC.innerHTML = `
    <h2>Elegir una CD</h2>
    <table>
      <thead>
        <tr>
          <th class="text">Dificultad</th>
          <th>CD</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Muy fácil</td>
          <td>5</td>
        </tr>
        <tr>
          <td>Fácil</td>
          <td>10</td>
        </tr>
        <tr>
          <td>Media</td>
          <td>15</td>
        </tr>
        <tr>
          <td>Difícil</td>
          <td>20</td>
        </tr>
        <tr>
          <td>Muy difícil</td>
          <td>25</td>
        </tr>
        <tr>
          <td>Casi imposible</td>
          <td>30</td>
        </tr>
      </tbody>
    </table>
  `;
  return settingDC;
};
