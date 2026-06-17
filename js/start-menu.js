import { image_map } from './windows.js';

export const subheads = new Map([
  ['Projects', 'View my work'],
  ['Contact Info', 'Get in Touch'],
]);

export function makeAppImageList(cname, arr, subheads, bold, use_subheads) {
  let item = `<div class="${cname}">`;
  arr.forEach((app) => {
    const entry = image_map.get(app);
    if (!entry) {
      console.error(`No image_map entry for: "${app}"`);
      return;
    }
    if (use_subheads && subheads.has(app)) {
      item += `<div class="${cname}_item" data-app="${app}">
        <img src="${entry[0]}" alt="${entry[1]}">
        <div><h3>${app}</h3><h4>${subheads.get(app)}</h4></div>
      </div>`;
    } else if (bold) {
      item += `<div class="${cname}_item" data-app="${app}">
        <img src="${entry[0]}" alt="${entry[1]}"><h3>${app}</h3>
      </div>`;
    } else {
      item += `<div class="${cname}_item" data-app="${app}">
        <img src="${entry[0]}" alt="${entry[1]}"><p>${app}</p>
      </div>`;
    }
  });
  return item + `</div>`;
}

const allApps = [
  'About Me',
  'Resume',
  'Projects',
  'Contact Info',
  'Media Player',
  'Music Player',
  'Command Prompt',
  'Minesweeper',
  'Notepad',
  'Paint',
  'Github',
  'LinkedIn',
  'Image Viewer',
  'Spider Solitaire',
];

class StartMenu extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div>
        <div class="top_start_menu">
          <img src="/Res/Chess_Pieces.png" alt="user profile picture">
          <h2>Connor Dalley</h2>
        </div>
        <div class="middle_start_menu">
          <div class="left_start_menu">
            ${makeAppImageList('top_left_start', ['Projects', 'Contact Info'], subheads, false, true)}
            ${makeAppImageList('bottom_left_start', ['About Me', 'Music Player', 'Media Player', 'Paint', 'Notepad'], subheads, false, true)}
            <button class="allprograms">
              <h3>All Programs</h3>
              <img src="/Res/all_progs.svg" alt="all programs">
            </button>
          </div>
          <div class="right_start_menu">
            ${makeAppImageList('top_right_start', ['Github', 'LinkedIn'], subheads, true, true)}
            ${makeAppImageList('bottom_right_start', ['Command Prompt', 'Resume', 'Minesweeper', 'Spider Solitaire', 'Image Viewer'], subheads, false, true)}
          </div>
        </div>
        <div class="bottom_start_menu">
          <div><img src="/Res/Logout.png" alt="log off"><p>Log Off</p></div>
          <div><img src="/Res/Power.png" alt="shut down"><p>Shut Down</p></div>
        </div>
      </div>`;

    // All Programs popup
    const allProgramsPopup = document.createElement('div');
    allProgramsPopup.classList.add('all_programs_popup');
    allProgramsPopup.innerHTML = makeAppImageList(
      'all_programs_list',
      allApps,
      subheads,
      false,
      false
    );
    this.appendChild(allProgramsPopup);

    const allProgramsBtn = this.querySelector('.allprograms');
    let hideTimeout;
    const show = () => {
      clearTimeout(hideTimeout);
      allProgramsPopup.classList.add('open');
    };
    const hide = () => {
      hideTimeout = setTimeout(
        () => allProgramsPopup.classList.remove('open'),
        100
      );
    };

    allProgramsBtn.addEventListener('mouseenter', show);
    allProgramsBtn.addEventListener('mouseleave', hide);
    allProgramsPopup.addEventListener('mouseenter', show);
    allProgramsPopup.addEventListener('mouseleave', hide);
  }
}
customElements.define('start-menu', StartMenu);

const startButton = document.querySelector('.start_button');
export const startMenu = document.querySelector('start-menu');

startButton.addEventListener('click', (e) => {
  e.stopPropagation();
  startMenu.classList.toggle('open');
  startButton.classList.toggle('dimmed');
});

document.addEventListener('click', (e) => {
  if (!startMenu.contains(e.target)) {
    startMenu.classList.remove('open');
    startButton.classList.remove('dimmed');
  }
});

// Close start menu on any app launch
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-app]')) {
    startMenu.classList.remove('open');
    startButton.classList.remove('dimmed');
    startMenu.querySelector('.all_programs_popup')?.classList.remove('open');
  }
});
