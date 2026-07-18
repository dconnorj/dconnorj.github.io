import { appWindows } from './windows.js';

const minesweeperWindow = appWindows.get('Minesweeper');

const MS_BASE = 'https://ziebelje.github.io/minesweeper/';

// zoom scales up the board's native 16px-cell rendering so Beginner/
// Intermediate aren't a cramped little postage stamp — each level lands
// around the same on-screen width as Expert's native (unzoomed) board.
const LEVELS = {
  beginner: { label: 'Beginner', width: 9, height: 9, mines: 10, zoom: 2.7 },
  intermediate: { label: 'Intermediate', width: 16, height: 16, mines: 40, zoom: 1.8 },
  expert: { label: 'Expert', width: 30, height: 16, mines: 99, zoom: 1 },
};

let currentLevel = 'beginner';

const msCanvasFrame = document.querySelector('.ms-canvas-area');

// A srcdoc document with no `sandbox` attribute inherits its parent's
// origin, so pulling the real game's JS/CSS from ziebelje.github.io in here
// (instead of pointing `src` straight at that page) keeps the iframe
// same-origin with us. That's what lets the code below reach into it
// (contentWindow) to drive difficulty changes and read board size, despite
// the assets themselves living on another origin. Only #play_area is
// rendered — the site's own title and difficulty buttons are skipped since
// this file reproduces them in the window's own Game menu.
function buildSrcdoc() {
  return `<!DOCTYPE html>
<html><head>
<base href="${MS_BASE}">
<link rel="stylesheet" href="${MS_BASE}css/minesweeper.css">
<style>html,body{margin:0;padding:0;background:#c0c0c0;}</style>
<script src="${MS_BASE}js/rocket.12.06.js"></script>
<script src="${MS_BASE}js/seedrandom.js"></script>
<script src="${MS_BASE}js/minesweeper.js"></script>
<script>
  // minesweeper.js's own $.ready handler builds the board itself but never
  // exposes the instance it creates, so the prototype is patched to stash
  // a reference this window can drive later (new difficulty, resize reads).
  (function () {
    var original = arcade.minesweeper.prototype.new_game;
    arcade.minesweeper.prototype.new_game = function () {
      window.__msGame = this;
      return original.apply(this, arguments);
    };
  })();
</script>
<script src="${MS_BASE}js/tile.js"></script>
<script src="${MS_BASE}js/face.js"></script>
<script src="${MS_BASE}js/grid.js"></script>
<script src="${MS_BASE}js/ssd.js"></script>
</head>
<body>
<div id="play_area"></div>
</body></html>`;
}

function resizeToBoard() {
  const win = msCanvasFrame.contentWindow;
  const table = win?.document.querySelector('table');
  if (!table) return;

  // The table is measured inside the iframe's own document, so this is
  // always its native (unzoomed) size — zoom is applied to the iframe
  // element from out here and only affects how it's painted, not its own
  // internal layout, so the display size has to be derived by hand.
  const boardWidth = Math.ceil(table.getBoundingClientRect().width);
  const boardHeight = Math.ceil(table.getBoundingClientRect().height);
  const zoom = LEVELS[currentLevel].zoom;
  msCanvasFrame.style.width = `${boardWidth}px`;
  msCanvasFrame.style.height = `${boardHeight}px`;
  msCanvasFrame.style.zoom = zoom;

  const displayWidth = Math.ceil(boardWidth * zoom);
  const displayHeight = Math.ceil(boardHeight * zoom);

  const contentEl = minesweeperWindow.shadowRoot.querySelector('.content');
  const chromeWidth = minesweeperWindow.offsetWidth - contentEl.clientWidth;
  const chromeHeight = minesweeperWindow.offsetHeight - contentEl.clientHeight;
  const pageHead = document.querySelector('.ms-page-head');
  const footer = document.querySelector('.ms-footer');

  minesweeperWindow.style.width = `${displayWidth + chromeWidth}px`;
  minesweeperWindow.style.height = `${
    displayHeight + pageHead.offsetHeight + footer.offsetHeight + chromeHeight
  }px`;
}

function setLevel(levelKey) {
  currentLevel = levelKey;
  const win = msCanvasFrame.contentWindow;
  if (!win?.__msGame) return;
  const { width, height, mines } = LEVELS[levelKey];
  win.__msGame.new_game(width, height, mines);
  resizeToBoard();
}

function resetMinesweeper() {
  // buildSrcdoc() returns the same string every time (level is applied
  // afterward via new_game), and reassigning an unchanged srcdoc can be a
  // no-op in some browsers — same issue paint-window.js/the old version of
  // this file guarded against for `src`. Routing through a blank page first
  // forces a real reload so reopening the app always gets a fresh board.
  msCanvasFrame.removeAttribute('srcdoc');
  msCanvasFrame.src = 'about:blank';
  requestAnimationFrame(() => {
    msCanvasFrame.onload = () => setLevel(currentLevel);
    msCanvasFrame.srcdoc = buildSrcdoc();
  });
}

// The window is display:none while closed, which collapses the iframe to
// zero size, so the reload is deferred to the next open rather than done
// immediately on close (see paint-window.js for why that matters here).
let needsReset = true;

minesweeperWindow.addEventListener('window-opened', () => {
  if (needsReset) {
    requestAnimationFrame(resetMinesweeper);
    needsReset = false;
  }
});

minesweeperWindow.addEventListener('window-closed', () => {
  needsReset = true;
});

// Game/View dropdown menus
function getGameMenuItems() {
  const levelItem = (key) => {
    const { label } = LEVELS[key];
    const mark = key === currentLevel ? '• ' : '';
    return `<p class="ms-level" data-level="${key}">${mark}${label}</p>`;
  };
  return `
    <div class="ms-file-popup-btns">
      <p class="ms-file-new">New</p>
      ${levelItem('beginner')}
      ${levelItem('intermediate')}
      ${levelItem('expert')}
      <p class="ms-file-disabled">Best Times...</p>
      <p class="ms-file-exit">Exit</p>
    </div>`;
}

function getViewMenuItems() {
  return `
    <div class="ms-view-popup-btns">
      <p class="ms-view-max ms-file-disabled">Maximize</p>
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
  msMenuOpen ? closeMsMenu() : openMsMenu(msFileBtn, getGameMenuItems());
});
msViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  msMenuOpen ? closeMsMenu() : openMsMenu(msViewBtn, getViewMenuItems());
});
msFileBtn.addEventListener('mouseenter', () => {
  if (msMenuOpen) openMsMenu(msFileBtn, getGameMenuItems());
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
  if (target.classList.contains('ms-file-new')) setLevel(currentLevel);
  if (target.classList.contains('ms-level')) setLevel(target.dataset.level);
  if (target.classList.contains('ms-view-min')) minesweeperWindow.minimize();
  closeMsMenu();
});
