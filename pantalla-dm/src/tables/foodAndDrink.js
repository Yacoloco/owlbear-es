const r = (item, cost, sub = false) =>
  cost === null
    ? `<tr><td colspan="2">${item}</td></tr>`
    : `<tr${sub ? ' class="sub"' : ''}><td>${item}</td><td>${cost}</td></tr>`;

const table = (rows) => `
      <table>
        <thead>
          <tr>
            <th class="text">Artículo</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((x) => r(...x)).join('')}
        </tbody>
      </table>`;

export const foodAndDrink = () => {
  const foodAndDrink = document.createElement('article');
  foodAndDrink.classList.add('card', 'two-column');
  foodAndDrink.innerHTML = `
    <h2>Comida, bebida y alojamiento</h2>
    <div class="tables-wide">
      ${table([
        ['Cerveza', null],
        ['Galón', '2 pp', true],
        ['Jarra', '2 pc', true],
        ['Banquete (por persona)', '10 po'],
        ['Pan, hogaza', '2 pc'],
        ['Queso, trozo', '1 pp'],
        ['Carne, pedazo', '3 pp'],
        ['Vino', null],
        ['Común (jarra)', '2 pp', true],
        ['Fino (botella)', '10 po', true],
        ['Licores', null],
        ['Medida', '1-5 po', true],
        ['Cóctel', '5-10 po', true],
        ['Botella', '10-30 po', true],
      ])}
      ${table([
        ['Alojamiento (por noche)', null],
        ['Miserable', '7 pc', true],
        ['Pobre', '1 pp', true],
        ['Modesto', '5 pp', true],
        ['Cómodo', '8 pp', true],
        ['Rico', '2 po', true],
        ['Aristocrático', '4 po', true],
        ['Comidas (por día)', null],
        ['Miserable', '3 pc', true],
        ['Pobre', '6 pc', true],
        ['Modesto', '3 pp', true],
        ['Cómodo', '5 pp', true],
        ['Rico', '8 pp', true],
        ['Aristocrático', '2 po', true],
      ])}
    </div>
    <p class="fine-print">po = piezas de oro · pp = piezas de plata · pc = piezas de cobre</p>
  `;
  return foodAndDrink;
};
