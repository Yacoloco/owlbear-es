export const attribution = () => {
  const attribution = document.createElement('article');
  attribution.classList.add('card', 'three-column', 'fine-print');
  attribution.innerHTML = `<p>Este trabajo incluye material tomado del System Reference Document 5.1 (“SRD 5.1”) de Wizards of the Coast LLC, disponible en <a href="https://dnd.wizards.com/resources/systems-reference-document" target="_blank">https://dnd.wizards.com/resources/systems-reference-document</a>. El SRD 5.1 está bajo la licencia Creative Commons Atribución 4.0 Internacional, disponible en <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank">https://creativecommons.org/licenses/by/4.0/legalcode</a>.</p>`;
  return attribution;
};