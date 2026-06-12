////////////////////////
// StartMenu Components
///////////////////////
function makeAppImageList(cname, arr, image_map, subheads, bold, use_subheads) {
  let item = `<div class="${cname}">`;
  arr.forEach(app => {
    const entry = image_map.get(app);
    if (!entry) {
      console.error(`No image_map entry found for: "${app}"`);
      return;
    }
    if (use_subheads && subheads.has(app)){
        item += `<div class="${cname}_item">
                    <img src="${entry[0]}" alt="${entry[1]}">
                    <div>
                        <h3>${app}</h3>
                        <h4>${subheads.get(app)}</h4>
                    </div>
                </div>`;
    }
    else if(bold){
        item += `<div class="${cname}_item">
                    <img src="${entry[0]}" alt="${entry[1]}">
                    <h3>${app}</h3>
                </div>`;
    }
    else{
        item += `<div class="${cname}_item">
                    <img src="${entry[0]}" alt="${entry[1]}">
                    <p>${app}</p>
                </div>`;
    }
  });
  return item + `</div>`;
}
const image_map = new Map()
const subheads = new Map()
image_map.set("About Me", ["/Res/Tour XP.png", "about me app"]);
image_map.set("Resume", ["/Res/adobe-pdf-icon-logo-vector-01.png", "my resume app"]);
image_map.set("Projects", ["/Res/Appearance.png", "my projects app"]);
image_map.set("Contact Info", ["/Res/OE Send.png", "contact info app"]);
image_map.set("Media Player", ["/Res/dwsd58yvs5pe1.png", "media player app"]);
image_map.set("Music Player", ["/Res/MP3 player.png", "music player app"]);
image_map.set("Command Prompt", ["/Res/Command Prompt.png", "command prompt app"]);
image_map.set("Minesweeper", ["/Res/Minesweeper.png", "minesweeper aoo"]);
image_map.set("Notepad", ["/Res/Notepad.png", "notepad app"]);
image_map.set("Paint", ["/Res/Paint.png", "paint app"]);
image_map.set("Github", ["/Res/github-svgrepo-com.svg", "github link"]);
image_map.set("LinkedIn", ["/Res/linkedin-svgrepo-com.svg", "linkedin link"]);
image_map.set("Image Viewer", ["/Res/Windows Picture and Fax Viewer.png", "image viewer app"]);
image_map.set("Spider Solitaire", ["/Res/Spider Solitaire.png", "spider solitaire app"]);

subheads.set("Projects", "View my work");
subheads.set("Contact Info", "Get in Touch");


class StartMenu extends HTMLElement{
    connectedCallback() {
        this.innerHTML = `
        <div>
            <div class="top_start_menu">
                <img src="/Res/Chess_Pieces.png" alt="user profile picture">
                <h2>Connor Dalley</h2>
            </div>
            <div class="middle_start_menu">
                <div class="left_start_menu">
                    ${makeAppImageList("top_left_start", ["Projects", "Contact Info"], image_map, subheads, false, true)}
                    ${makeAppImageList("bottom_left_start", ["About Me", "Music Player", "Media Player", "Paint", "Notepad"], image_map, subheads, false, true)}
                    <button class="allprograms">
                        <h3>All Programs</h3>
                        <img src="/Res/all_progs.svg" alt="all programs">
                    </button>
                </div>
                <div class="right_start_menu">
                    ${makeAppImageList("top_right_start", ["Github", "LinkedIn"], image_map, subheads, true, true)}
                    ${makeAppImageList("bottom_right_start", ["Command Prompt", "Resume", "Minesweeper", "Spider Solitaire", "Image Viewer"], image_map, subheads, false, true)}
                </div>
            </div>
            <div class="bottom_start_menu">
                <div>
                    <img src="/Res/Logout.png" alt="log off button">
                    <p>Log Off</p>
                </div>
                <div>
                    <img src="/Res/Power.png" alt="Shut Down Button">
                    <p>Shut Down</p>
                </div>
            </div>
        </div>
        `;
    }
}
customElements.define("start-menu", StartMenu);

const startButton = document.querySelector('.start_button');
const startMenu = document.querySelector('start-menu');

startButton.addEventListener('click', (e) => {
  e.stopPropagation(); // prevents the click from bubbling to document
  startMenu.classList.toggle('open');
  startButton.classList.toggle('dimmed'); // dim the button when open
});

// close when clicking outside
document.addEventListener('click', (e) => {
  if (!startMenu.contains(e.target)) {
    startMenu.classList.remove('open');
    startButton.classList.remove('dimmed');
  }
});

const allProgramsBtn = startMenu.querySelector('.allprograms');

const allApps = [
  "About Me", "Resume", "Projects", "Contact Info",
  "Media Player", "Music Player", "Command Prompt",
  "Minesweeper", "Notepad", "Paint", "Github",
  "LinkedIn", "Image Viewer", "Spider Solitaire"
];

// build the popup once
const allProgramsPopup = document.createElement('div');
allProgramsPopup.classList.add('all_programs_popup');
allProgramsPopup.innerHTML = makeAppImageList("all_programs_list", allApps, image_map, subheads, false, false);
startMenu.appendChild(allProgramsPopup);

let hideTimeout;

allProgramsBtn.addEventListener('mouseenter', () => {
  clearTimeout(hideTimeout);
  allProgramsPopup.classList.add('open');
});

allProgramsBtn.addEventListener('mouseleave', () => {
  hideTimeout = setTimeout(() => {
    allProgramsPopup.classList.remove('open');
  }, 100); // small delay gives cursor time to reach the popup
});

allProgramsPopup.addEventListener('mouseenter', () => {
  clearTimeout(hideTimeout); // cursor made it to the popup, cancel hide
});

allProgramsPopup.addEventListener('mouseleave', () => {
  hideTimeout = setTimeout(() => {
    allProgramsPopup.classList.remove('open');
  }, 100);
});

////////////////////////
// Tray Components
///////////////////////
const trayPopup = document.createElement('div');
trayPopup.classList.add('tray_popup');
document.body.appendChild(trayPopup);

const trayItems = [
  {
    selector: '.tray_info',
    hoverText: 'System Info',
    clickContent: `
      <div class="tray_info_box">
        <div class="tray_info_heading">
          <img src="Res/Information.png">
          <h3>Welcome to Connor Dalley XP!</h3>
          <div class="close_info_box">
            <img src="Res/Exit.png">
          </div>
        </div>
        <p>A showcase of my abilities and achivments, created in homage to Windows XP, the greatest OS of all time!</p>
        <p>Get Started: About Me | My Projects</p>
      </div>
    `
  },
  {
    selector: '.toggle_crt',
    hoverText: 'Toggle CRT Effect',
    clickContent: '<p>CRT mode toggled</p>'
  },
  {
    selector: '.toggle_fullscreen',
    hoverText: 'Toggle Fullscreen',
    clickContent: '<p>Fullscreen toggled</p>'
  }
];

function positionCentered(btn) {
  trayPopup.style.left = '0px';
  trayPopup.style.top = '0px';

  requestAnimationFrame(() => {
    const rect = btn.getBoundingClientRect();
    const popupRect = trayPopup.getBoundingClientRect();

    trayPopup.style.left = `${rect.left + (rect.width / 2) - (popupRect.width / 2)}px`;
    trayPopup.style.top = `${rect.top - popupRect.height - 8}px`;
  });
}

function positionAboveOffset(btn) {
  trayPopup.style.left = '0px';
  trayPopup.style.top = '0px';

  requestAnimationFrame(() => {
    const rect = btn.getBoundingClientRect();
    const popupRect = trayPopup.getBoundingClientRect();
    const buttonCenter = rect.left + (rect.width / 2);

    const left = Math.max(8, buttonCenter - (popupRect.width * 0.9));
    trayPopup.style.left = `${left}px`;
    trayPopup.style.top = `${rect.top - popupRect.height - 8}px`;
  });
}

////////////////////////
// Fullscreen Toggle
///////////////////////
const fullscreenBtn = document.querySelector('.toggle_fullscreen');
const fullscreenImg = fullscreenBtn.querySelector('img');

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function updateFullscreenIcon() {
  if (document.fullscreenElement) {
    fullscreenImg.src = '/Res/IE Shrink Image.png';
    fullscreenImg.alt = 'exit fullscreen';
  } else {
    fullscreenImg.src = '/Res/IE Enlarge Image.png';
    fullscreenImg.alt = 'enter fullscreen';
  }
}

document.addEventListener('fullscreenchange', updateFullscreenIcon);
updateFullscreenIcon();

////////////////////////
// CRT Effect
///////////////////////
const crtOverlay = document.createElement('div');
crtOverlay.classList.add('crt_overlay');
document.body.appendChild(crtOverlay);

const crtBtn = document.querySelector('.toggle_crt');
const crtImg = crtBtn.querySelector('img');

let crtOn = true; // starts on

function updateCrtState() {
  if (crtOn) {
    document.body.classList.add('crt-active');
    crtImg.src = '/Res/Security - Ok.png';
    crtImg.alt = 'CRT effect on';
  } else {
    document.body.classList.remove('crt-active');
    crtImg.src = '/Res/Security Error.png';
    crtImg.alt = 'CRT effect off';
  }
}

document.body.classList.add('crt-active'); // initial state
updateCrtState();

////////////////////////
// Tray Item Listeners
///////////////////////
let trayHideTimeout;

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

  btn.addEventListener('mouseleave', () => {
    trayHideTimeout = setTimeout(() => {
      trayPopup.classList.remove('open');
      trayPopup.classList.remove('has-arrow');
    }, 100);
  });

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

trayPopup.addEventListener('mouseenter', () => {
  clearTimeout(trayHideTimeout);
});

trayPopup.addEventListener('mouseleave', () => {
  trayHideTimeout = setTimeout(() => {
    trayPopup.classList.remove('open');
    trayPopup.classList.remove('has-arrow');
  }, 100);
});

trayPopup.addEventListener('click', (e) => {
  e.stopPropagation();

  if (e.target.closest('.close_info_box')) {
    trayPopup.classList.remove('open');
    trayPopup.classList.remove('has-arrow');
  }
});

document.addEventListener('click', (e) => {
  if (
    !trayItems.some(({ selector }) => e.target.closest(selector)) &&
    !e.target.closest('.tray_popup')
  ) {
    trayPopup.classList.remove('open');
    trayPopup.classList.remove('has-arrow');
  }
});

////////////////////////
// Clock
///////////////////////
function updateTime() {
  const now = new Date();
  document.querySelector('.active_time').textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

updateTime();
setInterval(updateTime, 1000);