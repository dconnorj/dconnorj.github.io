import { appWindows } from './windows.js';

const resumeWindow = appWindows.get('Resume');

document
  .querySelector('.res-contact-btn')
  .addEventListener('click', () => appWindows.get('Contact Me').open());

// Zoom button: enlarge the resume so the user can scroll up/down to read
// the detail. Zoom out by clicking the button again or clicking anywhere on
// the zoomed document. While not zoomed, clicking the document zooms in on
// the area that was clicked (width is left alone, only vertical scroll
// changes, since width is already capped/filled by the layout rules).
const resMainContent = document.querySelector('.res-main-content');
const resZoomBtn = document.querySelector('.res-zoom-btn');
const resumeImg = resMainContent.querySelector('img');

function setZoomed(isZoomed, clickFraction = 0) {
  resMainContent.classList.toggle('zoomed', isZoomed);
  resZoomBtn.classList.toggle('active', isZoomed);
  if (!isZoomed) return;
  const maxScroll = resumeImg.offsetHeight - resMainContent.clientHeight;
  resMainContent.scrollTop = Math.max(
    0,
    Math.min(
      clickFraction * resumeImg.offsetHeight - resMainContent.clientHeight / 2,
      maxScroll
    )
  );
}

resZoomBtn.addEventListener('click', () => {
  setZoomed(!resMainContent.classList.contains('zoomed'));
});
resMainContent.addEventListener('click', (e) => {
  if (resMainContent.classList.contains('zoomed')) {
    setZoomed(false);
  } else {
    const rect = resumeImg.getBoundingClientRect();
    const clickFraction = (e.clientY - rect.top) / rect.height;
    setZoomed(true, clickFraction);
  }
});

// Save: download the resume PDF to the user's computer
function downloadResume() {
  const link = document.createElement('a');
  link.href = '/Res/Connor_Dalley_Resume_SWE.pdf';
  link.download = 'Connor_Dalley_Resume_SWE.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.querySelector('.res-save-btn').addEventListener('click', downloadResume);

// File/View dropdown menus
const fileMenuItems = `
  <div class="res-file-popup-btns">
    <p class="res-file-save">Save</p>
    <p class="res-file-disabled">Print</p>
    <p class="res-file-exit">Exit</p>
  </div>`;

function getViewMenuItems() {
  const isMaximized = resumeWindow.classList.contains('maximized');
  return `
    <div class="res-view-popup-btns">
      <p class="res-view-max">${isMaximized ? 'Restore' : 'Maximize'}</p>
      <p class="res-view-min">Minimize</p>
    </div>`;
}

const resDropdown = document.createElement('div');
resDropdown.classList.add('res-dropdown-menu');
resDropdown.style.display = 'none';
document.body.appendChild(resDropdown);

let resMenuOpen = false;

function openResMenu(btn, content) {
  const rect = btn.getBoundingClientRect();
  resDropdown.innerHTML = content;
  resDropdown.style.display = 'block';
  resDropdown.style.left = `${rect.left}px`;
  resDropdown.style.top = `${rect.bottom}px`;
  resMenuOpen = true;
}

function closeResMenu() {
  resDropdown.style.display = 'none';
  resMenuOpen = false;
}

const resFileBtn = document.querySelector('.res-file');
const resViewBtn = document.querySelector('.res-view');

resFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resMenuOpen ? closeResMenu() : openResMenu(resFileBtn, fileMenuItems);
});
resViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resMenuOpen ? closeResMenu() : openResMenu(resViewBtn, getViewMenuItems());
});
resFileBtn.addEventListener('mouseenter', () => {
  if (resMenuOpen) openResMenu(resFileBtn, fileMenuItems);
});
resViewBtn.addEventListener('mouseenter', () => {
  if (resMenuOpen) openResMenu(resViewBtn, getViewMenuItems());
});

document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.res-dropdown-menu') &&
    !e.target.closest('.res-file') &&
    !e.target.closest('.res-view')
  ) {
    closeResMenu();
  }
});

resDropdown.addEventListener('click', (e) => {
  const target = e.target.closest('p');
  if (!target) return;
  if (target.classList.contains('res-file-save')) downloadResume();
  if (target.classList.contains('res-file-exit')) resumeWindow.close();
  if (target.classList.contains('res-view-max')) resumeWindow.toggleMaximize();
  if (target.classList.contains('res-view-min')) resumeWindow.minimize();
  closeResMenu();
});
