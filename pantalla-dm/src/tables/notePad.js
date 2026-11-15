import { downloadFile } from '../utils.js';

const EMAIL = "johnteckert@gmail.com";

export const notePad = () => {
  const notePad = document.createElement('article');
  notePad.classList.add('card', 'notepad');
  notePad.innerHTML = `
    <h2>Notas</h2>
    <textarea id="notes" rows="10" cols="30" placeholder="Escribí tus notas acá..."></textarea>
    <div class="button-container">
      <button id="clear-button">Borrar</button>
      <button id="download-button">Descargar</button>
    </div>
  `;

  const downloadButton = notePad.querySelector('#download-button');
  const clearButton = notePad.querySelector('#clear-button');

  downloadButton.addEventListener('click', () => {
    const fileData = [
      new Date().toLocaleDateString(),
      ' ',
      new Date().toLocaleTimeString(),
      '\n\n',
      notePad.querySelector('textarea').value
    ];
    const file = new File(fileData, 'notas.txt', {
      type: 'text/plain',
    });
    downloadFile(file);
  });

  clearButton.addEventListener('click', () => {
    const notes = notePad.querySelector('textarea');
    notes.value = '';
    notes.focus();
  });

  return notePad;
}

