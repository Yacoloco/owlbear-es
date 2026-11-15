export const actionList = () => {
  const actionList = document.createElement('article');
  actionList.classList.add('card', 'half-screen');
  actionList.innerHTML = `
    <h2>Acciones</h2>
    <table class="text">
      <thead>
        <tr>
          <th>Acción</th>
          <th>Descripción</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Atacar</td>
          <td>Hacés un ataque cuerpo a cuerpo o a distancia.</td>
        </tr>
        <tr>
          <td>Lanzar un conjuro</td>
          <td>Lanzás un truco o un conjuro de nivel 1 o superior (ver su tiempo de lanzamiento). Solo podés lanzar un conjuro de nivel por turno, pero podés lanzar otro como reacción.</td>
        </tr>
        <tr>
          <td>Correr</td>
          <td>Ganás movimiento adicional igual a tu velocidad durante este turno. Se suma después de tu movimiento normal.</td>
        </tr>
        <tr>
          <td>Destrabarse</td>
          <td>Tu movimiento no provoca ataques de oportunidad durante el resto del turno.</td>
        </tr>
        <tr>
          <td>Esquivar</td>
          <td>Hasta el inicio de tu próximo turno, las tiradas de ataque contra vos tienen desventaja si podés ver al atacante, y tenés ventaja en las tiradas de salvación de Destreza. Perdés este beneficio si quedás incapacitado o si tu velocidad baja a 0.</td>
        </tr>
        <tr>
          <td>Agarrar</td>
          <td>(Reemplaza un ataque cuerpo a cuerpo) Hacés una prueba de Atletismo enfrentada a una de Atletismo o Acrobacias del objetivo. Si ganás, el objetivo queda agarrado.</td>
        </tr>
        <tr>
          <td>Ayudar</td>
          <td>Ayudás a otra criatura con una prueba de habilidad o una tirada de ataque. El objetivo tiene ventaja en la siguiente prueba o ataque que haga antes del inicio de tu próximo turno.</td>
        </tr>
        <tr>
          <td>Esconderse</td>
          <td>Hacés una prueba de Destreza (Sigilo) para intentar esconderte. Mientras estás escondido tenés ventaja en tus ataques y los ataques contra vos tienen desventaja.</td>
        </tr>
        <tr>
          <td>Preparar</td>
          <td>Esperás a que ocurra algo para actuar, usando tu reacción antes del inicio de tu próximo turno. Decidís de antemano qué circunstancia la dispara y qué vas a hacer. Si preparás un conjuro, debe tener tiempo de lanzamiento de 1 acción y tenés que mantener la concentración hasta soltarlo.</td>
        </tr>
        <tr>
          <td>Buscar</td>
          <td>Hacés una prueba de Sabiduría (Percepción) o de Inteligencia (Investigación) para encontrar algo.</td>
        </tr>
        <tr>
          <td>Empujar</td>
          <td>(Reemplaza un ataque cuerpo a cuerpo) Hacés una prueba de Atletismo enfrentada a una de Atletismo o Acrobacias del objetivo. Si ganás, lo derribás o lo empujás 5 pies lejos de vos.</td>
        </tr>
        <tr>
          <td>Usar un objeto mágico</td>
          <td>Usás un objeto mágico que requiere una acción.</td>
        </tr>
        <tr>
          <td>Usar un objeto</td>
          <td>Usás un objeto que requiere una acción.</td>
        </tr>
        <tr>
          <td>Usar una habilidad especial</td>
          <td>Usás un rasgo o habilidad especial que requiere una acción.</td>
        </tr>
      </tbody>
    </table>
  `;
  return actionList;
};
