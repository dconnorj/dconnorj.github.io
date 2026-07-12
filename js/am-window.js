import {
  openExternalLinkConfirm,
  externalLinks,
  appWindows,
} from './windows.js';

const aboutMeWindow = appWindows.get('About Me');

// XP-style fake loading: growing address bar
const amAddressBar = document.querySelector('.am-address-bar');
const amMainContent = document.querySelector('.am-main-content');

function playAddressBarLoading(barDuration = 200) {
  amAddressBar.style.setProperty('--am-load-duration', `${barDuration}ms`);
  amAddressBar.classList.add('is-loading');
  amMainContent.classList.add('is-loading');
  // reveal the content mid-bar so it fades in while the bar finishes growing
  setTimeout(
    () => amMainContent.classList.remove('is-loading'),
    barDuration / 2
  );
  setTimeout(() => amAddressBar.classList.remove('is-loading'), barDuration);
}

// Desktop reveal itself is driven by the boot sequence (boot.js); once it
// finishes, run the same address-bar loading flourish here.
document.addEventListener('xp-boot-complete', () => playAddressBarLoading());
aboutMeWindow.addEventListener('window-opened', () => playAddressBarLoading());

// Collapsible sidebar boxes
document
  .querySelectorAll(
    '.am-education-box-title, .am-skills-box-title, .am-socials-box-title'
  )
  .forEach((titleEl) => {
    const arrow = titleEl.querySelector('img');
    const content = titleEl.nextElementSibling;
    arrow.style.cursor = 'pointer';
    arrow.addEventListener('click', () => {
      const isCollapsed = content.style.display === 'none';
      content.style.display = isCollapsed ? '' : 'none';
      arrow.style.transformOrigin = 'center center';
      arrow.style.transform = isCollapsed ? '' : 'rotate(180deg)';
    });
  });

// Nav buttons
document
  .querySelector('.am-projects-btn')
  .addEventListener('click', () => appWindows.get('Projects').open());
document
  .querySelector('.am-resume-btn')
  .addEventListener('click', () => appWindows.get('Resume').open());

// Socials
document.querySelectorAll('.am-socials-box-content div').forEach((div) => {
  const text = div.querySelector('p')?.textContent.trim();
  if (text && externalLinks.has(text)) {
    div.style.cursor = 'pointer';
    div.addEventListener('click', () =>
      openExternalLinkConfirm(text, externalLinks.get(text))
    );
  }
});

// File/View dropdown menus
const fileMenuItems = `
  <div class="am-file-popup-btns">
    <p class="am-file-disabled">Print</p>
    <p class="am-file-disabled">Print Setup</p>
    <p class="am-file-exit">Exit</p>
  </div>`;

function getViewMenuItems() {
  const isMaximized = aboutMeWindow.classList.contains('maximized');
  return `
    <div class="am-view-popup-btns">
      <p class="am-view-max">${isMaximized ? 'Restore' : 'Maximize'}</p>
      <p class="am-view-min">Minimize</p>
    </div>`;
}

const amDropdown = document.createElement('div');
amDropdown.classList.add('am-dropdown-menu');
amDropdown.style.display = 'none';
document.body.appendChild(amDropdown);

let amMenuOpen = false;

function openAmMenu(btn, content) {
  const rect = btn.getBoundingClientRect();
  amDropdown.innerHTML = content;
  amDropdown.style.display = 'block';
  amDropdown.style.left = `${rect.left}px`;
  amDropdown.style.top = `${rect.bottom}px`;
  amMenuOpen = true;
}

function closeAmMenu() {
  amDropdown.style.display = 'none';
  amMenuOpen = false;
}

const amFileBtn = document.querySelector('.am-file');
const amViewBtn = document.querySelector('.am-view');

amFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  amMenuOpen ? closeAmMenu() : openAmMenu(amFileBtn, fileMenuItems);
});
amViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  amMenuOpen ? closeAmMenu() : openAmMenu(amViewBtn, getViewMenuItems());
});
amFileBtn.addEventListener('mouseenter', () => {
  if (amMenuOpen) openAmMenu(amFileBtn, fileMenuItems);
});
amViewBtn.addEventListener('mouseenter', () => {
  if (amMenuOpen) openAmMenu(amViewBtn, getViewMenuItems());
});

document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.am-dropdown-menu') &&
    !e.target.closest('.am-file') &&
    !e.target.closest('.am-view')
  ) {
    closeAmMenu();
  }
});

amDropdown.addEventListener('click', (e) => {
  const target = e.target.closest('p');
  if (!target) return;
  if (target.classList.contains('am-file-exit')) aboutMeWindow.close();
  if (target.classList.contains('am-view-max')) aboutMeWindow.toggleMaximize();
  if (target.classList.contains('am-view-min')) aboutMeWindow.minimize();
  closeAmMenu();
});
