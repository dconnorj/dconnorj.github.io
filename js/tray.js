import { appWindows } from './windows.js';

// Clock
function updateTime() {
  document.querySelector('.active_time').textContent =
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
updateTime();
setInterval(updateTime, 1000);

// CRT
const crtOverlay = document.createElement('div');
crtOverlay.classList.add('crt_overlay');
document.body.appendChild(crtOverlay);
const crtImg = document.querySelector('.toggle_crt img');
let crtOn = true;

function updateCrtState() {
  document.body.classList.toggle('crt-active', crtOn);
  crtImg.src = crtOn ? '/Res/Security - Ok.png' : '/Res/Security Error.png';
  crtImg.alt = crtOn ? 'CRT effect on' : 'CRT effect off';
}
document.body.classList.add('crt-active');
updateCrtState();

// Fullscreen
const fullscreenImg = document.querySelector('.toggle_fullscreen img');
function toggleFullscreen() {
  document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
}
function updateFullscreenIcon() {
  fullscreenImg.src = document.fullscreenElement
    ? '/Res/IE Shrink Image.png'
    : '/Res/IE Enlarge Image.png';
}
document.addEventListener('fullscreenchange', updateFullscreenIcon);
updateFullscreenIcon();

// Tray popup
const trayPopup = document.createElement('div');
trayPopup.classList.add('tray_popup');
document.body.appendChild(trayPopup);

function positionCentered(btn) {
  trayPopup.style.cssText = 'left:0;top:0';
  requestAnimationFrame(() => {
    const r = btn.getBoundingClientRect(),
      p = trayPopup.getBoundingClientRect();
    trayPopup.style.left = `${r.left + r.width / 2 - p.width / 2}px`;
    trayPopup.style.top = `${r.top - p.height - 8}px`;
  });
}

function positionAboveOffset(btn) {
  trayPopup.style.cssText = 'left:0;top:0';
  requestAnimationFrame(() => {
    const r = btn.getBoundingClientRect(),
      p = trayPopup.getBoundingClientRect();
    trayPopup.style.left = `${Math.max(8, r.left + r.width / 2 - p.width * 0.9)}px`;
    trayPopup.style.top = `${r.top - p.height - 8}px`;
  });
}

const trayItems = [
  {
    selector: '.tray_info',
    hoverText: 'System Info',
    clickContent: `<div class="tray_info_box">
      <div class="tray_info_heading">
        <img src="Res/Information.png">
        <h3>Welcome to Connor Dalley XP!</h3>
        <div class="close_info_box"><img src="Res/Exit.png"></div>
      </div>
      <p>A showcase of my abilities and achievements, created in homage to Windows XP!</p>
      <p>Get Started: <span class="tray_link" data-tray-app="About Me">About Me</span> | <span class="tray_link" data-tray-app="Projects">My Projects</span></p>
    </div>`,
  },
  { selector: '.toggle_crt', hoverText: 'Toggle CRT Effect' },
  { selector: '.toggle_fullscreen', hoverText: 'Toggle Fullscreen' },
];

let trayHideTimeout;
const hideTray = () => {
  trayHideTimeout = setTimeout(() => {
    trayPopup.classList.remove('open', 'has-arrow');
  }, 100);
};

trayItems.forEach(({ selector, hoverText, clickContent }) => {
  const btn = document.querySelector(selector);
  if (!btn) return;

  btn.addEventListener('mouseenter', () => {
    clearTimeout(trayHideTimeout);
    trayPopup.classList.remove('has-arrow');
    trayPopup.innerHTML = `<p>${hoverText}</p>`;
    trayPopup.classList.add('open');
    positionCentered(btn);
  });
  btn.addEventListener('mouseleave', hideTray);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (selector === '.toggle_fullscreen') {
      toggleFullscreen();
      return;
    }
    if (selector === '.toggle_crt') {
      crtOn = !crtOn;
      updateCrtState();
      return;
    }
    trayPopup.classList.add('has-arrow');
    trayPopup.innerHTML = clickContent;
    trayPopup.classList.add('open');
    positionAboveOffset(btn);
  });
});

trayPopup.addEventListener('mouseenter', () => clearTimeout(trayHideTimeout));
trayPopup.addEventListener('mouseleave', hideTray);
trayPopup.addEventListener('click', (e) => {
  e.stopPropagation();
  if (e.target.closest('.close_info_box')) {
    trayPopup.classList.remove('open', 'has-arrow');
    return;
  }
  const link = e.target.closest('.tray_link');
  if (link) {
    appWindows.get(link.dataset.trayApp)?.open();
    trayPopup.classList.remove('open', 'has-arrow');
  }
});

// Show the system info popup on first visit
window.addEventListener('load', () => {
  const infoBtn = document.querySelector('.tray_info');
  const infoItem = trayItems.find((item) => item.selector === '.tray_info');
  if (!infoBtn || !infoItem) return;
  trayPopup.classList.add('has-arrow');
  trayPopup.innerHTML = infoItem.clickContent;
  trayPopup.classList.add('open');
  positionAboveOffset(infoBtn);
});

document.addEventListener('click', (e) => {
  if (
    !trayItems.some(({ selector }) => e.target.closest(selector)) &&
    !e.target.closest('.tray_popup')
  ) {
    trayPopup.classList.remove('open', 'has-arrow');
  }
});
