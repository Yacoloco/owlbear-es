const row = (skill, ability) => `<tr><td>${skill}</td><td>${ability}</td></tr>`;
const table = (rows) => `
      <table>
        <thead>
          <tr>
            <th>Habilidad</th>
            <th>Característica</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(([s, a]) => row(s, a)).join('')}
        </tbody>
      </table>`;

export const skills = () => {
  const skills = document.createElement('article');
  skills.classList.add('card', 'three-column');
  skills.innerHTML = `
    <h2>Habilidades y su característica</h2>
    <div class="tables-wide">
      ${table([
        ['Acrobacias', 'Destreza'],
        ['Trato con Animales', 'Sabiduría'],
        ['Arcanos', 'Inteligencia'],
        ['Atletismo', 'Fuerza'],
        ['Engaño', 'Carisma'],
        ['Historia', 'Inteligencia'],
      ])}
      ${table([
        ['Perspicacia', 'Sabiduría'],
        ['Intimidación', 'Carisma'],
        ['Investigación', 'Inteligencia'],
        ['Medicina', 'Sabiduría'],
        ['Naturaleza', 'Inteligencia'],
        ['Percepción', 'Sabiduría'],
      ])}
      ${table([
        ['Interpretación', 'Carisma'],
        ['Persuasión', 'Carisma'],
        ['Religión', 'Inteligencia'],
        ['Juego de Manos', 'Destreza'],
        ['Sigilo', 'Destreza'],
        ['Supervivencia', 'Sabiduría'],
      ])}
    </div>
  `;
  return skills;
};
