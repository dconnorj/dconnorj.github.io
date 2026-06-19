import { appWindows } from './windows.js';

const resumeWindow = appWindows.get('Resume');

// File/View dropdown menus
const fileMenuItems = `
  <div class="res-file-popup-btns">
    <p>Save</p>
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
  if (target.classList.contains('res-file-exit')) resumeWindow.close();
  if (target.classList.contains('res-view-max')) resumeWindow.toggleMaximize();
  if (target.classList.contains('res-view-min')) resumeWindow.minimize();
  closeResMenu();
});
