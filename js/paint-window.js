import { appWindows } from './windows.js';

const paintWindow = appWindows.get('Paint');

// Fake loading: show a wait cursor and hide the canvas for a beat on open,
// like a real app "launching". Closing the window resets the canvas.
//
// jspaint autosaves/restores its last session on its own regardless of the
// URL hash used to load it (verified: reloading with the same "#local:id"
// hash, a brand-new unused id, or no hash at all all resume the last-drawn
// state) — so a plain reload can't be used to reset it. "#load:<image>"
// is the one hash command that actually overrides that restore, so an
// 800x600 white PNG data URI there is used as the "blank canvas" state.
const BLANK_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAJYAQAAAACyDb/dAAAA6ElEQVR42u3NMQEAAAwCIPuX1hbbAwVID0QikUgkEolEIpFIJBKJRCKRSCQSiUQikUgkEolEIpFIJBKJRCKRSCQSiUQikUgkEolEIpFIJBKJRCKRSCQSiUQikUgkEolEIpFIJBKJRCKRSCQSiUQikUgkEolEIpFIJBKJRCKRSCQSiUQikUgkEolEIpFIJBKJRCKRSCQSiUQikUgkEolEIpFIJBKJRCKRSCQSiUQikUgkEolEIpFIJBKJRCKRSCQSiUQikUgkEolEIpFIJBKJRCL5TQZi5oNIWL0OEAAAAABJRU5ErkJggg==';
const PAINT_SRC = `https://jspaint.app/#load:${encodeURIComponent(BLANK_PNG)}`;
const LOAD_DELAY_MS = 2500;

const ptContent = document.querySelector('.pt-content');
const ptCanvasFrame = document.querySelector('.pt-canvas-area');

function resetCanvas() {
  // Assigning the same src is a no-op in some browsers, so force a real
  // reload by routing through a blank page first.
  ptCanvasFrame.src = 'about:blank';
  requestAnimationFrame(() => {
    ptCanvasFrame.src = PAINT_SRC;
  });
}

// The window is `display:none` while closed, which collapses the iframe to
// zero size; loading jspaint into a collapsed frame makes it miscalculate
// its canvas fit and bake a black band into the bitmap. So the close
// handler only arms a flag — the actual reload happens on the next open,
// once the window (and iframe) has real dimensions again.
let needsReset = true;

paintWindow.addEventListener('window-opened', () => {
  ptContent.classList.add('loading');
  setTimeout(() => ptContent.classList.remove('loading'), LOAD_DELAY_MS);
  if (needsReset) {
    requestAnimationFrame(resetCanvas);
    needsReset = false;
  }
});

paintWindow.addEventListener('window-closed', () => {
  needsReset = true;
});

// File/View dropdown menus
const fileMenuItems = `
  <div class="pt-file-popup-btns">
    <p class="pt-file-disabled">New...</p>
    <p class="pt-file-disabled">Save</p>
    <p class="pt-file-disabled">Print</p>
    <p class="pt-file-exit">Close</p>
  </div>`;

function getViewMenuItems() {
  const isMaximized = paintWindow.classList.contains('maximized');
  return `
    <div class="pt-view-popup-btns">
      <p class="pt-view-max">${isMaximized ? 'Restore' : 'Maximize'}</p>
      <p class="pt-view-min">Minimize</p>
    </div>`;
}

const ptDropdown = document.createElement('div');
ptDropdown.classList.add('pt-dropdown-menu');
ptDropdown.style.display = 'none';
document.body.appendChild(ptDropdown);

let ptMenuOpen = false;

function openPtMenu(btn, content) {
  const rect = btn.getBoundingClientRect();
  ptDropdown.innerHTML = content;
  ptDropdown.style.display = 'block';
  ptDropdown.style.left = `${rect.left}px`;
  ptDropdown.style.top = `${rect.bottom}px`;
  ptMenuOpen = true;
}

function closePtMenu() {
  ptDropdown.style.display = 'none';
  ptMenuOpen = false;
}

const ptFileBtn = document.querySelector('.pt-file');
const ptViewBtn = document.querySelector('.pt-view');

ptFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  ptMenuOpen ? closePtMenu() : openPtMenu(ptFileBtn, fileMenuItems);
});
ptViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  ptMenuOpen ? closePtMenu() : openPtMenu(ptViewBtn, getViewMenuItems());
});
ptFileBtn.addEventListener('mouseenter', () => {
  if (ptMenuOpen) openPtMenu(ptFileBtn, fileMenuItems);
});
ptViewBtn.addEventListener('mouseenter', () => {
  if (ptMenuOpen) openPtMenu(ptViewBtn, getViewMenuItems());
});

document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.pt-dropdown-menu') &&
    !e.target.closest('.pt-file') &&
    !e.target.closest('.pt-view')
  ) {
    closePtMenu();
  }
});

ptDropdown.addEventListener('click', (e) => {
  const target = e.target.closest('p');
  if (!target) return;
  if (target.classList.contains('pt-file-exit')) paintWindow.close();
  if (target.classList.contains('pt-view-max')) paintWindow.toggleMaximize();
  if (target.classList.contains('pt-view-min')) paintWindow.minimize();
  closePtMenu();
});
