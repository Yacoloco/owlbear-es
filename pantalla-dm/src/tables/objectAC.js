export const objectAC = () => {
  const objectAC = document.createElement('article');
  objectAC.classList.add('card');
  objectAC.innerHTML = `
    <h2>CA de objetos</h2>
    <table>
      <thead>
        <tr>
          <th class="text">Material</th>
          <th>CA</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Tela, papel, cuerda</td>
          <td>11</td>
        </tr>
        <tr>
          <td>Cristal, vidrio, hielo</td>
          <td>13</td>
        </tr>
        <tr>
          <td>Madera, hueso</td>
          <td>15</td>
        </tr>
        <tr>
          <td>Piedra</td>
          <td>17</td>
        </tr>
        <tr>
          <td>Hierro, acero</td>
          <td>19</td>
        </tr>
        <tr>
          <td>Mithral</td>
          <td>21</td>
        </tr>
        <tr>
          <td>Adamantina</td>
          <td>23</td>
        </tr>
      </tbody>
    </table>
  `;
  return objectAC;
};
