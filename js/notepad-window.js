import { appWindows } from './windows.js';

const notepadWindow = appWindows.get('Notepad');

const NOTEPAD_SRC = 'https://98.js.org/programs/notepad/';
const LOAD_DELAY_MS = 2000;

const npContent = document.querySelector('.np-content');
const npCanvasFrame = document.querySelector('.np-canvas-area');

function resetNotepad() {
  // Assigning the same src is a no-op in some browsers, so force a real
  // reload by routing through a blank page first.
  npCanvasFrame.src = 'about:blank';
  requestAnimationFrame(() => {
    npCanvasFrame.src = NOTEPAD_SRC;
  });
}

// The window is display:none while closed, which collapses the iframe to
// zero size, so the reload is deferred to the next open rather than done
// immediately on close (see paint-window.js for why that matters here).
let needsReset = true;

notepadWindow.addEventListener('window-opened', () => {
  npContent.classList.add('loading');
  setTimeout(() => npContent.classList.remove('loading'), LOAD_DELAY_MS);
  if (needsReset) {
    requestAnimationFrame(resetNotepad);
    needsReset = false;
  }
});

notepadWindow.addEventListener('window-closed', () => {
  needsReset = true;
});

// File/View dropdown menus
const fileMenuItems = `
  <div class="np-file-popup-btns">
    <p class="np-file-disabled">New</p>
    <p class="np-file-disabled">Save</p>
    <p class="np-file-disabled">Print</p>
    <p class="np-file-exit">Exit</p>
  </div>`;

function getViewMenuItems() {
  const isMaximized = notepadWindow.classList.contains('maximized');
  return `
    <div class="np-view-popup-btns">
      <p class="np-view-max">${isMaximized ? 'Restore' : 'Maximize'}</p>
      <p class="np-view-min">Minimize</p>
    </div>`;
}

const npDropdown = document.createElement('div');
npDropdown.classList.add('np-dropdown-menu');
npDropdown.style.display = 'none';
document.body.appendChild(npDropdown);

let npMenuOpen = false;

function openNpMenu(btn, content) {
  const rect = btn.getBoundingClientRect();
  npDropdown.innerHTML = content;
  npDropdown.style.display = 'block';
  npDropdown.style.left = `${rect.left}px`;
  npDropdown.style.top = `${rect.bottom}px`;
  npMenuOpen = true;
}

function closeNpMenu() {
  npDropdown.style.display = 'none';
  npMenuOpen = false;
}

const npFileBtn = document.querySelector('.np-file');
const npViewBtn = document.querySelector('.np-view');

npFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  npMenuOpen ? closeNpMenu() : openNpMenu(npFileBtn, fileMenuItems);
});
npViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  npMenuOpen ? closeNpMenu() : openNpMenu(npViewBtn, getViewMenuItems());
});
npFileBtn.addEventListener('mouseenter', () => {
  if (npMenuOpen) openNpMenu(npFileBtn, fileMenuItems);
});
npViewBtn.addEventListener('mouseenter', () => {
  if (npMenuOpen) openNpMenu(npViewBtn, getViewMenuItems());
});

document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.np-dropdown-menu') &&
    !e.target.closest('.np-file') &&
    !e.target.closest('.np-view')
  ) {
    closeNpMenu();
  }
});

npDropdown.addEventListener('click', (e) => {
  const target = e.target.closest('p');
  if (!target) return;
  if (target.classList.contains('np-file-exit')) notepadWindow.close();
  if (target.classList.contains('np-view-max')) notepadWindow.toggleMaximize();
  if (target.classList.contains('np-view-min')) notepadWindow.minimize();
  closeNpMenu();
});
