export const travelPace = () => {
  const travelPace = document.createElement('article');
  travelPace.classList.add('card', 'two-column');
  travelPace.innerHTML = `
    <h2>Ritmo de viaje</h2>
    <table>
      <thead>
        <tr>
          <th>Ritmo</th>
          <th>Por minuto</th>
          <th>Por hora</th>
          <th>Por día</th>
          <th class="text">Efecto</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>lento</td>
          <td>200 pies</td>
          <td>2 millas</td>
          <td>18 millas</td>
          <td class="text">permite usar Sigilo</td>
        </tr>
        <tr>
          <td>normal</td>
          <td>300 pies</td>
          <td>3 millas</td>
          <td>24 millas</td>
          <td class="text">sin efecto</td>
        </tr>
        <tr>
          <td>rápido</td>
          <td>400 pies</td>
          <td>4 millas</td>
          <td>30 millas</td>
          <td class="text">-5 a Percepción pasiva</td>
        </tr>
      </tbody>
    </table>
  `;
  return travelPace;
}
