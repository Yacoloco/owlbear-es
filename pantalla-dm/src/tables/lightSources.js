export const lightSources = () => {
  const lightSources = document.createElement('article');
  lightSources.classList.add('card');
  lightSources.innerHTML = `
    <h2>Luz</h2>
    <table>
      <thead>
        <tr>
          <th>Fuente</th>
          <th>Luz brillante</th>
          <th>Luz tenue</th>
          <th>Duración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Vela</td>
          <td>5 pies</td>
          <td>+ 5 pies</td>
          <td>1 hora</td> 
        </tr>
        <tr>
          <td>Lámpara</td>
          <td>15 pies</td>
          <td>+30 pies</td>
          <td>6 horas</td>
        </tr>
        <tr>
          <td>Linterna sorda</td>
          <td>60 pies, cono</td>
          <td>+ 60 pies</td>
          <td>6 horas</td>
        </tr>
        <tr>
          <td>Linterna de capucha</td>
          <td>30 pies, cono</td>
          <td>+ 30 pies</td>
          <td>6 horas</td>
        </tr>
        <tr>
          <td>Capucha bajada</td>
          <td> - </td>
          <td>+ 5 pies</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Antorcha</td>
          <td>20 pies</td>
          <td>+ 20 pies</td>
          <td>1 hora</td>
        </tr>
      </tbody>
    </table>
  `;
  return lightSources;
};
