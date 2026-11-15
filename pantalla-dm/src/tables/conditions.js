export const conditions = () => {
  const conditions = document.createElement('article');
  conditions.classList.add('card', 'half-screen');
  conditions.innerHTML = `
    <h2>Estados</h2>
    <table class="text">
      <thead>
        <tr>
          <th>Estado</th>
          <th>Efecto</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cegado</td>
          <td>Falla automáticamente cualquier prueba que requiera la vista. Desventaja en sus tiradas de ataque. Los ataques contra él tienen ventaja.</td>
        </tr>
        <tr>
          <td>Hechizado</td>
          <td>No puede atacar a quien lo hechizó ni elegirlo como objetivo de habilidades o efectos dañinos. Quien lo hechizó tiene ventaja en las pruebas para interactuar socialmente con él.</td>
        </tr>
        <tr>
          <td>Ensordecido</td>
          <td>Falla automáticamente cualquier prueba de característica que requiera el oído.</td>
        </tr>
        <tr>
          <td>Cansancio</td>
          <td>
            <ol>
              <li>Desventaja en las pruebas de característica.</li>
              <li>Velocidad reducida a la mitad.</li>
              <li>Desventaja en tiradas de ataque y de salvación.</li>
              <li>Puntos de golpe máximos reducidos a la mitad.</li>
              <li>Velocidad reducida a 0.</li>
              <li>Muerte.</li>
            </ol>
          </td>
        </tr>
        <tr>
          <td>Caída</td>
          <td>Al terminar una caída, la criatura recibe 1d6 de daño contundente por cada 10 pies que cayó (máximo 20d6) y queda derribada.</td>
        </tr>
        <tr>
          <td>Asustado</td>
          <td>Desventaja en pruebas de característica y tiradas de ataque mientras la fuente de su miedo esté a la vista. No puede acercarse voluntariamente a la fuente de su miedo.</td>
        </tr>
        <tr>
          <td>Agarrado</td>
          <td>Su velocidad pasa a ser 0 y no puede beneficiarse de bonificadores a la velocidad. El estado termina si quien lo agarra queda incapacitado, o si un efecto lo saca de su alcance (por ejemplo, si lo arroja lejos el conjuro <i>ola atronadora</i>).</td>
        </tr>
        <tr>
          <td>Escondido</td>
          <td>Al atacar a un objetivo que no podés ver, tenés desventaja; si no está en el lugar que elegiste, fallás automáticamente. Si una criatura no te puede ver, tenés ventaja en tus ataques contra ella. Si estás escondido y atacás, revelás tu posición al acertar o fallar.</td>
        </tr>
        <tr>
          <td>Incapacitado</td>
          <td>No puede realizar acciones ni reacciones.</td>
        </tr>
        <tr>
          <td>Invisible</td>
          <td>Es imposible verlo sin magia o un sentido especial. A efectos de esconderse, se considera muy oscurecido. Su posición puede detectarse por los ruidos que haga o las huellas que deje. Los ataques contra él tienen desventaja y sus ataques tienen ventaja.</td>
        </tr>
        <tr>
          <td>Paralizado</td>
          <td>Está incapacitado y no puede moverse ni hablar. Falla automáticamente las tiradas de salvación de Fuerza y Destreza. Los ataques contra él tienen ventaja. Cualquier ataque que lo impacte es crítico si el atacante está a 5 pies o menos.</td>
        </tr>
        <tr>
          <td>Petrificado</td>
          <td>Se transforma, junto con los objetos no mágicos que lleve, en una sustancia sólida inanimada (normalmente piedra). Su peso se multiplica por diez y deja de envejecer. Está incapacitado, no puede moverse ni hablar y no es consciente de su entorno. Los ataques contra él tienen ventaja. Falla automáticamente las tiradas de salvación de Fuerza y Destreza. Tiene resistencia a todo el daño. Es inmune al veneno y las enfermedades (los que ya tuviera quedan en suspenso, no neutralizados).</td>
        </tr>
        <tr>
          <td>Envenenado</td>
          <td>Desventaja en tiradas de ataque y pruebas de característica.</td>
        </tr>
        <tr>
          <td>Derribado</td>
          <td>Solo puede moverse arrastrándose, salvo que use la mitad de su movimiento para levantarse, lo que termina el estado. Desventaja en sus tiradas de ataque. Los ataques contra él tienen ventaja si el atacante está a 5 pies o menos; si no, tienen desventaja.</td>
        </tr>
        <tr>
          <td>Apresado</td>
          <td>Su velocidad pasa a ser 0 y no puede beneficiarse de bonificadores a la velocidad. Los ataques contra él tienen ventaja y sus ataques tienen desventaja. Desventaja en las tiradas de salvación de Destreza.</td>
        </tr>
        <tr>
          <td>Aturdido</td>
          <td>Está incapacitado, no puede moverse y solo puede hablar balbuceando. Falla automáticamente las tiradas de salvación de Fuerza y Destreza. Los ataques contra él tienen ventaja.</td>
        </tr>
        <tr>
          <td>Inconsciente</td>
          <td>Está incapacitado, no puede moverse ni hablar y no es consciente de su entorno. Suelta lo que tenga en las manos y cae derribado. Falla automáticamente las tiradas de salvación de Fuerza y Destreza. Los ataques contra él tienen ventaja. Cualquier ataque que lo impacte es crítico si el atacante está a 5 pies o menos.</td>
        </tr>
      </tbody>
    </table>
  `;
  return conditions;
};
