export const servicesAndTransportation = () => {
  const servicesAndTransportation = document.createElement('article');
  servicesAndTransportation.classList.add('card');
  servicesAndTransportation.innerHTML = `
    <h2>Servicios y transporte</h2>
    <table>
      <thead>
        <tr>
          <th class="text">Servicio</th>
          <th>Precio</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Carruaje dentro de la ciudad (por milla)</td>
          <td>3 pc</td>
        </tr>
        <tr>
          <td>Alquiler de carruaje (por día)</td>
          <td>1 po</td>
        </tr>
        <tr>
          <td>Asalariado capacitado (por día)</td>
          <td>2 po</td>
        </tr>
          <tr>
          <td>Asalariado no capacitado (por día)</td>
          <td>2 pp</td>
        </tr>
        <tr>
          <td>Mensajero (por milla)</td>
          <td>2 pc</td>
        </tr>
        <tr>
          <td>Peaje de camino o puerta</td>
          <td>1 pc</td>
        </tr>
        <tr>
          <td>Pasaje en barco (por milla)</td>
          <td>1 pp</td>
        </tr>
      </tbody>
    </table>
  `;
  return servicesAndTransportation;
}
