import { appWindows } from './windows.js';

const projectsWindow = appWindows.get('Projects');

// File/View dropdown menus
const fileMenuItems = `
  <div class="proj-file-popup-btns">
    <p class="proj-file-disabled">New Window</p>
    <p class="proj-file-disabled proj-file-border">Save As..</p>
    <p class="proj-file-disabled">Page Setup..</p>
    <p class="proj-file-disabled proj-file-border">Print..</p>
    <p class="proj-file-exit">Exit</p>
  </div>`;

function getViewMenuItems() {
  const isMaximized = projectsWindow.classList.contains('maximized');
  return `
    <div class="proj-view-popup-btns">
      <p class="proj-view-max">${isMaximized ? 'Restore' : 'Maximize'}</p>
      <p class="proj-view-min">Minimize</p>
    </div>`;
}

const projDropdown = document.createElement('div');
projDropdown.classList.add('proj-dropdown-menu');
projDropdown.style.display = 'none';
document.body.appendChild(projDropdown);

let projMenuOpen = false;

function openProjMenu(btn, content) {
  const rect = btn.getBoundingClientRect();
  projDropdown.innerHTML = content;
  projDropdown.style.display = 'block';
  projDropdown.style.left = `${rect.left}px`;
  projDropdown.style.top = `${rect.bottom}px`;
  projMenuOpen = true;
}

function closeProjMenu() {
  projDropdown.style.display = 'none';
  projMenuOpen = false;
}

const projFileBtn = document.querySelector('.proj-file');
const projViewBtn = document.querySelector('.proj-view');

projFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  projMenuOpen ? closeProjMenu() : openProjMenu(projFileBtn, fileMenuItems);
});
projViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  projMenuOpen ? closeProjMenu() : openProjMenu(projViewBtn, getViewMenuItems());
});
projFileBtn.addEventListener('mouseenter', () => {
  if (projMenuOpen) openProjMenu(projFileBtn, fileMenuItems);
});
projViewBtn.addEventListener('mouseenter', () => {
  if (projMenuOpen) openProjMenu(projViewBtn, getViewMenuItems());
});

document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.proj-dropdown-menu') &&
    !e.target.closest('.proj-file') &&
    !e.target.closest('.proj-view')
  ) {
    closeProjMenu();
  }
});

projDropdown.addEventListener('click', (e) => {
  const target = e.target.closest('p');
  if (!target) return;
  if (target.classList.contains('proj-file-exit')) projectsWindow.close();
  if (target.classList.contains('proj-view-max')) projectsWindow.toggleMaximize();
  if (target.classList.contains('proj-view-min')) projectsWindow.minimize();
  closeProjMenu();
});
