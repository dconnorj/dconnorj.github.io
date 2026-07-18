import { appWindows } from './windows.js';

const solitaireWindow = appWindows.get('Spider Solitaire');

const SOLITAIRE_SRC = '/Res/spider-solitaire/index.html';

const solCanvasFrame = document.querySelector('.sol-canvas-area');

function resetSolitaire() {
  // Assigning the same src is a no-op in some browsers, so force a real
  // reload by routing through a blank page first.
  solCanvasFrame.src = 'about:blank';
  requestAnimationFrame(() => {
    solCanvasFrame.src = SOLITAIRE_SRC;
  });
}

// The window is display:none while closed, which collapses the iframe to
// zero size, so the reload is deferred to the next open rather than done
// immediately on close (see paint-window.js for why that matters here).
let needsReset = true;

solitaireWindow.addEventListener('window-opened', () => {
  if (needsReset) {
    requestAnimationFrame(resetSolitaire);
    needsReset = false;
  }
});

solitaireWindow.addEventListener('window-closed', () => {
  needsReset = true;
});

// Game/View dropdown menus
const gameMenuItems = `
  <div class="sol-file-popup-btns">
    <p class="sol-file-disabled">New Game</p>
    <p class="sol-file-exit">Exit</p>
  </div>`;

function getViewMenuItems() {
  const isMaximized = solitaireWindow.classList.contains('maximized');
  return `
    <div class="sol-view-popup-btns">
      <p class="sol-view-max">${isMaximized ? 'Restore' : 'Maximize'}</p>
      <p class="sol-view-min">Minimize</p>
    </div>`;
}

const solDropdown = document.createElement('div');
solDropdown.classList.add('sol-dropdown-menu');
solDropdown.style.display = 'none';
document.body.appendChild(solDropdown);

let solMenuOpen = false;

function openSolMenu(btn, content) {
  const rect = btn.getBoundingClientRect();
  solDropdown.innerHTML = content;
  solDropdown.style.display = 'block';
  solDropdown.style.left = `${rect.left}px`;
  solDropdown.style.top = `${rect.bottom}px`;
  solMenuOpen = true;
}

function closeSolMenu() {
  solDropdown.style.display = 'none';
  solMenuOpen = false;
}

const solFileBtn = document.querySelector('.sol-file');
const solViewBtn = document.querySelector('.sol-view');

solFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  solMenuOpen ? closeSolMenu() : openSolMenu(solFileBtn, gameMenuItems);
});
solViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  solMenuOpen ? closeSolMenu() : openSolMenu(solViewBtn, getViewMenuItems());
});
solFileBtn.addEventListener('mouseenter', () => {
  if (solMenuOpen) openSolMenu(solFileBtn, gameMenuItems);
});
solViewBtn.addEventListener('mouseenter', () => {
  if (solMenuOpen) openSolMenu(solViewBtn, getViewMenuItems());
});

document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.sol-dropdown-menu') &&
    !e.target.closest('.sol-file') &&
    !e.target.closest('.sol-view')
  ) {
    closeSolMenu();
  }
});

solDropdown.addEventListener('click', (e) => {
  const target = e.target.closest('p');
  if (!target) return;
  if (target.classList.contains('sol-file-exit')) solitaireWindow.close();
  if (target.classList.contains('sol-view-max')) solitaireWindow.toggleMaximize();
  if (target.classList.contains('sol-view-min')) solitaireWindow.minimize();
  closeSolMenu();
});
