import {
  appWindows,
  externalLinks,
  openExternalLinkConfirm,
} from './windows.js';
import { projects } from './projects-data.js';

const projectsWindow = appWindows.get('Projects');

// Inner-website-nav pixelation tuning: lower PIXEL_FONT_SIZE = blockier/less
// readable text; PIXEL_SCALE = how much bigger the blocky text is displayed.
const PIXEL_FONT_SIZE = 12;
const PIXEL_SCALE = 1.25;

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

  clear() {
    this.items = [];
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

function getProject(slug) {
  return projects.find((p) => p.slug === slug);
}

function projectsForPage(page) {
  return page === 'home'
    ? projects
    : projects.filter((p) => p.tags.includes(page));
}

const PROJECT_PAGE_PREFIX = 'project:';

function isProjectPage(page) {
  return page.startsWith(PROJECT_PAGE_PREFIX);
}

function projectPage(slug) {
  return `${PROJECT_PAGE_PREFIX}${slug}`;
}

function projectSlugFromPage(page) {
  return page.slice(PROJECT_PAGE_PREFIX.length);
}

function createInnerNav(page) {
  const iNav = document.createElement('div');
  iNav.className = 'inner-website-nav';
  projectsForPage(page).forEach((project) => {
    const row = document.createElement('div');
    row.appendChild(pixelatedTextCanvas(project.title));
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      goToPage(projectPage(project.slug));
    });
    iNav.appendChild(row);
  });
  return iNav;
}

const navBtns = [fullbtn, webbtn, mobilebtn, homebtn, backendbtn];

const pageByNavBtn = new Map([
  [fullbtn, 'full-stack'],
  [webbtn, 'web'],
  [mobilebtn, 'mobile'],
  [homebtn, 'home'],
  [backendbtn, 'back-end'],
]);
navBtns.forEach((btn) =>
  btn.appendChild(createInnerNav(pageByNavBtn.get(btn)))
);
const navBtnByPage = new Map(
  [...pageByNavBtn].map(([btn, page]) => [page, btn])
);
const templateIdByPage = new Map([
  ['home', 'tpl-page-home'],
  ['full-stack', 'tpl-page-full-stack'],
  ['web', 'tpl-page-web'],
  ['mobile', 'tpl-page-mobile'],
  ['back-end', 'tpl-page-back-end'],
]);
const urlPathByPage = new Map([
  ['home', ''],
  ['full-stack', '/full-stack'],
  ['web', '/web'],
  ['mobile', '/mobile'],
  ['back-end', '/back-end'],
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

const projPageBody = document.querySelector('.proj-page-body');
const projContentMain = document.querySelector('.proj-content-main');
const projMainArea = document.querySelector('.proj-main');
const projAddressBar = document.querySelector('.proj-address-bar');
const projBackBtn = document.querySelector('.proj-back-btn');
const projForwardBtn = document.querySelector('.proj-forward-btn');
const projAddressUrl = document.querySelector('.proj-address-url');

////////////////////////////////////
/// Retro "slow connection" page-load animation
////////////////////////////////////
// On startup (opening the window) the whole background flashes blank white
// and settles back to black; on every other navigation (tab switch,
// back/forward, project detail) it just stays black. Either way, text shows
// first (it's the smallest payload), then nav bar and page images pop in one
// by one, then the ad banner loads dead last — with a choppy blue progress
// streak crawling across the address bar the whole time.
let loadGeneration = 0;
const pendingLoadTimeouts = [];

function playPageLoadAnimation({ startup = false } = {}) {
  const generation = ++loadGeneration;
  pendingLoadTimeouts.splice(0).forEach(clearTimeout);

  const images = [
    ...document.querySelectorAll('.proj-content-nav img, .proj-content-nav video, .proj-content-nav canvas'),
    ...projPageBody.querySelectorAll('img, video'),
  ];
  const adImg = document.querySelector('.proj-ad-wrap img');

  // Snap straight to the hidden (and, on startup, blank white) state with no
  // fade-out — these elements are already visible from the last render, so
  // without this they'd slowly fade to hidden instead of flashing instantly.
  projMainArea.classList.add('proj-instant');
  images.forEach((el) => el.classList.add('proj-media-pending'));
  if (adImg) adImg.classList.add('proj-media-pending');
  projContentMain.classList.add('proj-content-hidden');
  if (startup) projMainArea.classList.add('proj-page-loading');
  void projMainArea.offsetWidth; // force the instant snap to paint
  projMainArea.classList.remove('proj-instant');

  const totalDuration = 2000 + Math.random() * 2000; // 2-4s
  const bgFlipDelay = 350; // white -> black (startup only)
  const contentRevealDelay = 550; // text/info appear once black has settled

  projAddressBar.style.setProperty('--proj-load-duration', `${totalDuration}ms`);
  projAddressBar.classList.remove('is-loading');
  void projAddressBar.offsetWidth; // restart the growing-bar animation
  projAddressBar.classList.add('is-loading');

  const schedule = (fn, delay) => {
    pendingLoadTimeouts.push(
      setTimeout(() => {
        if (generation === loadGeneration) fn();
      }, delay)
    );
  };

  if (startup) {
    schedule(() => projMainArea.classList.remove('proj-page-loading'), bgFlipDelay);
  }
  schedule(
    () => projContentMain.classList.remove('proj-content-hidden'),
    contentRevealDelay
  );

  // Images pop in as a handful of random batches (not one-by-one top to
  // bottom) — a few waves of delays, each with its own images shuffled in.
  const imageWindow = totalDuration * 0.75 - contentRevealDelay;
  const waveCount = Math.min(4, Math.max(1, Math.ceil(images.length / 3)));
  const waveDelays = Array.from({ length: waveCount }, (_, i) => {
    const base = contentRevealDelay + (imageWindow * (i + 1)) / (waveCount + 1);
    const jitter = (Math.random() - 0.5) * (imageWindow / (waveCount + 1));
    return Math.max(contentRevealDelay, base + jitter);
  });
  images.forEach((img) => {
    const delay = waveDelays[Math.floor(Math.random() * waveDelays.length)];
    schedule(() => img.classList.remove('proj-media-pending'), delay);
  });

  if (adImg) {
    schedule(() => adImg.classList.remove('proj-media-pending'), totalDuration);
  }
  schedule(() => projAddressBar.classList.remove('is-loading'), totalDuration);
}

projectsWindow.addEventListener('window-opened', () =>
  playPageLoadAnimation({ startup: true })
);

// A project detail page's own "tab" is its first tag, so the matching nav
// button stays highlighted (and its dropdown visible) while viewing it.
function navPageFor(page) {
  if (!isProjectPage(page)) return page;
  const project = getProject(projectSlugFromPage(page));
  return project ? project.tags[0] : 'home';
}

function urlPathFor(page) {
  if (isProjectPage(page)) return `/project/${projectSlugFromPage(page)}`;
  return urlPathByPage.get(page);
}

function buildProjItem(project) {
  const frag = document.createDocumentFragment();

  const border = document.createElement('div');
  border.className = 'main-content-bottom-border';
  border.innerHTML =
    '<div class="mcdiv1"></div><div class="mcdiv2"></div><div class="mcdiv3"></div>';
  frag.appendChild(border);

  const item = document.createElement('div');
  item.className = 'proj-item';
  item.innerHTML = `
    <div class="proj-item-desc">
      <h1 class="proj-item-title" data-slug="${project.slug}">${project.title}</h1>
      <p>${project.summary}</p>
    </div>
    <div class="proj-item-right">
      <img class="proj-item-img" src="${project.image}" />
      <div class="proj-item-decor"></div>
    </div>`;
  frag.appendChild(item);

  return frag;
}

function renderProjectItems(page) {
  const list = projPageBody.querySelector('.proj-item-list');
  if (!list) return;
  list.replaceChildren();
  projectsForPage(page).forEach((project) =>
    list.appendChild(buildProjItem(project))
  );
}

function renderProjectDetail(slug) {
  const project = getProject(slug);
  if (!project) {
    projPageBody.innerHTML = `
      <div class="proj-curr-page-info">
        <div class="info_text">
          <h1>PROJECT NOT FOUND</h1>
          <p>Sorry, that project doesn't exist (yet).</p>
        </div>
      </div>`;
    return;
  }

  const tagsHtml = project.tags
    .map((tag) => `<span class="proj-detail-tag">${tag}</span>`)
    .join('');
  const techHtml = project.techStack
    .map((tech) => `<li>${tech}</li>`)
    .join('');
  const border =
    '<div class="main-content-bottom-border"><div class="mcdiv1"></div><div class="mcdiv2"></div><div class="mcdiv3"></div></div>';
  const repoHtml =
    project.repoStatus === 'private'
      ? `<p class="proj-detail-repo-note">
          This one's a school project I'm keeping out of a public repo —
          reach out if you'd like to see the source.
        </p>`
      : `<button class="proj-detail-github-btn" type="button">
          View on GitHub
        </button>`;
  const videoEmbedHtml = project.video?.youtube
    ? `<iframe
        class="proj-detail-video"
        width="560"
        height="315"
        src="https://www.youtube.com/embed/${project.video.youtube}"
        title="${project.title} walkthrough"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>`
    : `<video
        class="proj-detail-video"
        controls
        ${project.video?.poster ? `poster="${project.video.poster}"` : ''}
        src="${project.video?.src}"
      ></video>`;
  const videoSectionHtml = project.video
    ? `
      ${border}
      <div class="proj-detail-section">
        <h2>Project Walkthrough:</h2>
        ${videoEmbedHtml}
      </div>`
    : '';

  projPageBody.innerHTML = `
    <div class="proj-detail">
      <div class="proj-detail-header">
        <h1>${project.title}</h1>
        <div class="proj-detail-tags">${tagsHtml}</div>
      </div>
      ${border}
      <img class="proj-detail-hero" src="${project.image}" alt="${project.title}" />
      <div class="proj-detail-section">
        <p>${project.description}</p>
      </div>
      <div class="proj-detail-section">
        <h2>Tech Stack:</h2>
        <ul class="proj-detail-tech-list">${techHtml}</ul>
      </div>
      ${repoHtml}
      ${videoSectionHtml}
      ${border}
      <button class="proj-detail-back-btn" type="button">
        &larr; Back to Projects
      </button>
    </div>`;

  const githubBtn = projPageBody.querySelector('.proj-detail-github-btn');
  if (githubBtn) {
    githubBtn.addEventListener('click', () => {
      openExternalLinkConfirm(project.title, project.github);
    });
  }
  projPageBody
    .querySelector('.proj-detail-back-btn')
    .addEventListener('click', goBack);
}

function renderPage(page) {
  if (isProjectPage(page)) {
    renderProjectDetail(projectSlugFromPage(page));
  } else {
    const template = document.getElementById(templateIdByPage.get(page));
    projPageBody.replaceChildren(template.content.cloneNode(true));
    renderProjectItems(page);
  }
  setActiveNavBtn(navBtnByPage.get(navPageFor(page)));
  projAddressUrl.textContent = `http://www.projects.net${urlPathFor(page)}`;
  randomizeAd();
  if (page === 'home') initHomeWidgets();
  playPageLoadAnimation();
}

function updateHistoryBtns() {
  projBackBtn.classList.toggle('active', !backStack.isEmpty());
  projForwardBtn.classList.toggle('active', !forwardStack.isEmpty());
}

function goToPage(page) {
  if (page === currentPage) return;
  backStack.push(currentPage);
  forwardStack.clear();
  currentPage = page;
  renderPage(page);
  updateHistoryBtns();
}

function goBack() {
  if (backStack.isEmpty()) return;
  forwardStack.push(currentPage);
  currentPage = backStack.pop();
  renderPage(currentPage);
  updateHistoryBtns();
}

function goForward() {
  if (forwardStack.isEmpty()) return;
  backStack.push(currentPage);
  currentPage = forwardStack.pop();
  renderPage(currentPage);
  updateHistoryBtns();
}

navBtns.forEach((btn) => {
  btn.addEventListener('click', () => goToPage(pageByNavBtn.get(btn)));
});

projPageBody.addEventListener('click', (e) => {
  const titleEl = e.target.closest('.proj-item-title');
  if (titleEl) goToPage(projectPage(titleEl.dataset.slug));
});

projBackBtn.addEventListener('click', goBack);
projForwardBtn.addEventListener('click', goForward);

const advert = document.querySelector('.proj-page-info img');
const adCount = 9;
function randomizeAd() {
  advert.src = `Res/ads/ad${Math.floor(Math.random() * adCount) + 1}.gif`;
}

////////////////////////////////////
/// Daily Trivia & Klingon Word
////////////////////////////////////

function todayDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function decodeHtmlEntities(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

async function loadKlingonWord(dateInt) {
  const res = await fetch('Res/klingon_words.json');
  const data = await res.json();
  const filtered = data.words.filter(
    (w) =>
      w.part_of_speech !== 'sentence' &&
      !w.definition.toLowerCase().includes(w.word.toLowerCase())
  );
  const word = filtered[dateInt % filtered.length];
  const el = document.getElementById('klingon-word-text');
  const url = `https://klingon.wiki/Word/${encodeURIComponent(word.word)}`;

  const link = document.createElement('a');
  link.textContent = word.word;
  link.href = '#';
  link.className = 'klingon-link';
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openExternalLinkConfirm('Klingon Wiki', url);
  });

  el.replaceChildren(
    document.createTextNode(
      "Klingon Language Lesson - Today's Klingon word is "
    ),
    link,
    document.createTextNode(` (${word.definition})`)
  );
}

async function loadTrivia(dateKey) {
  const cacheKey = `trivia-${dateKey}`;
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(cacheKey));
  } catch (_) {}

  let question, answer, type;
  if (cached) {
    ({ question, answer, type } = cached);
  } else {
    const res = await fetch('https://opentdb.com/api.php?amount=1&category=9');
    const data = await res.json();
    const result = data.results[0];
    question = decodeHtmlEntities(result.question);
    answer = decodeHtmlEntities(result.correct_answer);
    type = result.type;
    localStorage.setItem(cacheKey, JSON.stringify({ question, answer, type }));
  }

  const questionLabel =
    type === 'boolean'
      ? `Today's Trivia Question: (True or False) ${question}`
      : `Today's Trivia Question: ${question}`;
  document.getElementById('trivia-question-text').textContent = questionLabel;
  document.getElementById('trivia-answer-text').textContent = `${answer}`;
}

const backToTopBtn = document.querySelector('.proj-back-to-top-btn');
const projMain = document.querySelector('.proj-main');
backToTopBtn.addEventListener('mouseenter', () => {
  backToTopBtn.src = 'Res/main-content-res/back-to-top-hover.png';
});
backToTopBtn.addEventListener('mouseleave', () => {
  backToTopBtn.src = 'Res/main-content-res/back-to-top.png';
});
backToTopBtn.addEventListener('click', () => {
  projMain.scrollTo({ top: 0, behavior: 'smooth' });
});

const dateKey = todayDateKey();
const dateInt = parseInt(dateKey, 10);

// The socials block, Klingon word, and trivia question only exist in the
// home page template, so they're re-bound/re-loaded every time the home
// tab is (re)rendered rather than once at module load.
function initHomeWidgets() {
  document.querySelectorAll('.proj-main-socials a').forEach((link) => {
    const text = link.textContent.trim();
    if (externalLinks.has(text)) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openExternalLinkConfirm(text, externalLinks.get(text));
      });
    }
  });

  loadKlingonWord(dateInt).catch(() => {
    document.getElementById('klingon-word-text').textContent =
      "Klingon Language Lesson - Could not load today's word.";
  });
  loadTrivia(dateKey).catch(() => {
    document.getElementById('trivia-question-text').textContent =
      "Today's Trivia Question: Could not load.";
    document.getElementById('trivia-answer-text').textContent =
      "Today's Trivia Answer: Could not load.";
  });
}

renderPage(currentPage);
updateHistoryBtns();
