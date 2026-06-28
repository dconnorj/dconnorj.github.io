import { appWindows } from './windows.js';

const projectsWindow = appWindows.get('Projects');

// Inner-website-nav pixelation tuning: lower PIXEL_FONT_SIZE = blockier/less
// readable text; PIXEL_SCALE = how much bigger the blocky text is displayed.
const PIXEL_FONT_SIZE = 10;
const PIXEL_SCALE = 1.5;

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
  projMenuOpen
    ? closeProjMenu()
    : openProjMenu(projViewBtn, getViewMenuItems());
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
  if (target.classList.contains('proj-view-max'))
    projectsWindow.toggleMaximize();
  if (target.classList.contains('proj-view-min')) projectsWindow.minimize();
  closeProjMenu();
});

////////////////////////////////////
/// Page Nav Logic
////////////////////////////////////
class Stack {
  constructor() {
    this.items = [];
  }

  push(element) {
    this.items.push(element);
  }

  pop() {
    if (this.isEmpty()) {
      return null;
    }
    return this.items.pop();
  }

  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  print() {
    console.log(this.items);
  }
}

let currentPage = 'home';
const backStack = new Stack();
const forwardStack = new Stack();
const fullbtn = document.querySelector('.proj-full-stack-btn');
const webbtn = document.querySelector('.proj-web-btn');
const mobilebtn = document.querySelector('.proj-mobile-btn');
const backendbtn = document.querySelector('.proj-back-end-btn');
const homebtn = document.querySelector('.proj-content-nav .proj-home-btn');

function pixelatedTextCanvas(text) {
  const font = `${PIXEL_FONT_SIZE}px "Helvetica Neue", Helvetica, Arial, sans-serif`;

  const measurer = document.createElement('canvas').getContext('2d');
  measurer.font = font;
  const w = Math.ceil(measurer.measureText(text).width) + 2;
  const h = Math.ceil(PIXEL_FONT_SIZE * 1.5);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w * PIXEL_SCALE}px`;
  canvas.style.height = `${h * PIXEL_SCALE}px`;
  canvas.style.imageRendering = 'pixelated';

  const ctx = canvas.getContext('2d');
  ctx.font = font;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 1, h / 2);

  return canvas;
}

function createInnerNav() {
  const iNav = document.createElement('div');
  iNav.className = 'inner-website-nav';
  ['SHORT', 'LONGER THAN', 'WOW THIS IS A LOT'].forEach((label) => {
    const row = document.createElement('div');
    row.appendChild(pixelatedTextCanvas(label));
    iNav.appendChild(row);
  });
  return iNav;
}

const navBtns = [fullbtn, webbtn, mobilebtn, homebtn, backendbtn];
navBtns.forEach((btn) => btn.appendChild(createInnerNav()));

const pageByNavBtn = new Map([
  [fullbtn, 'full-stack'],
  [webbtn, 'web'],
  [mobilebtn, 'mobile'],
  [homebtn, 'home'],
  [backendbtn, 'back-end'],
]);

function setActiveNavBtn(activeBtn) {
  navBtns.forEach((btn) => {
    const isActive = btn === activeBtn;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('inactive', !isActive);
    btn.querySelector('.inner-website-nav').style.display = isActive
      ? 'flex'
      : 'none';
  });
}

navBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentPage = pageByNavBtn.get(btn);
    setActiveNavBtn(btn);
  });
});

setActiveNavBtn(homebtn);

const advert = document.querySelector('.proj-page-info img');
const adCount = 9;
advert.src = `Res/ads/ad${Math.floor(Math.random() * adCount) + 1}.gif`;
