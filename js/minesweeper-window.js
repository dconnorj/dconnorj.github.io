import { appWindows } from './windows.js';

const minesweeperWindow = appWindows.get('Minesweeper');

const MINESWEEPER_SRC = 'https://ziebelje.github.io/minesweeper/';
const LOAD_DELAY_MS = 2000;

const msContent = document.querySelector('.ms-content');
const msCanvasFrame = document.querySelector('.ms-canvas-area');

function resetMinesweeper() {
  // Assigning the same src is a no-op in some browsers, so force a real
  // reload by routing through a blank page first.
  msCanvasFrame.src = 'about:blank';
  requestAnimationFrame(() => {
    msCanvasFrame.src = MINESWEEPER_SRC;
  });
}

// The window is display:none while closed, which collapses the iframe to
// zero size, so the reload is deferred to the next open rather than done
// immediately on close (see paint-window.js for why that matters here).
let needsReset = true;

minesweeperWindow.addEventListener('window-opened', () => {
  msContent.classList.add('loading');
  setTimeout(() => msContent.classList.remove('loading'), LOAD_DELAY_MS);
  if (needsReset) {
    requestAnimationFrame(resetMinesweeper);
    needsReset = false;
  }
});

minesweeperWindow.addEventListener('window-closed', () => {
  needsReset = true;
});

// Game/View dropdown menus
const gameMenuItems = `
  <div class="ms-file-popup-btns">
    <p class="ms-file-disabled">New</p>
    <p class="ms-file-disabled">Best Times...</p>
    <p class="ms-file-exit">Exit</p>
  </div>`;

function getViewMenuItems() {
  const isMaximized = minesweeperWindow.classList.contains('maximized');
  return `
    <div class="ms-view-popup-btns">
      <p class="ms-view-max">${isMaximized ? 'Restore' : 'Maximize'}</p>
      <p class="ms-view-min">Minimize</p>
    </div>`;
}

const msDropdown = document.createElement('div');
msDropdown.classList.add('ms-dropdown-menu');
msDropdown.style.display = 'none';
document.body.appendChild(msDropdown);

let msMenuOpen = false;

function openMsMenu(btn, content) {
  const rect = btn.getBoundingClientRect();
  msDropdown.innerHTML = content;
  msDropdown.style.display = 'block';
  msDropdown.style.left = `${rect.left}px`;
  msDropdown.style.top = `${rect.bottom}px`;
  msMenuOpen = true;
}

function closeMsMenu() {
  msDropdown.style.display = 'none';
  msMenuOpen = false;
}

const msFileBtn = document.querySelector('.ms-file');
const msViewBtn = document.querySelector('.ms-view');

msFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  msMenuOpen ? closeMsMenu() : openMsMenu(msFileBtn, gameMenuItems);
});
msViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  msMenuOpen ? closeMsMenu() : openMsMenu(msViewBtn, getViewMenuItems());
});
msFileBtn.addEventListener('mouseenter', () => {
  if (msMenuOpen) openMsMenu(msFileBtn, gameMenuItems);
});
msViewBtn.addEventListener('mouseenter', () => {
  if (msMenuOpen) openMsMenu(msViewBtn, getViewMenuItems());
});

document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.ms-dropdown-menu') &&
    !e.target.closest('.ms-file') &&
    !e.target.closest('.ms-view')
  ) {
    closeMsMenu();
  }
});

msDropdown.addEventListener('click', (e) => {
  const target = e.target.closest('p');
  if (!target) return;
  if (target.classList.contains('ms-file-exit')) minesweeperWindow.close();
  if (target.classList.contains('ms-view-max')) minesweeperWindow.toggleMaximize();
  if (target.classList.contains('ms-view-min')) minesweeperWindow.minimize();
  closeMsMenu();
});
