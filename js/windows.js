export const image_map = new Map([
  ['About Me', ['/Res/Tour XP.png', 'about me app']],
  ['Resume', ['/Res/adobe-pdf-icon-logo-vector-01.png', 'my resume app']],
  ['Projects', ['/Res/Appearance.png', 'my projects app']],
  ['Contact Me', ['/Res/Outlook Express.png', 'contact me app']],
  ['Media Player', ['/Res/dwsd58yvs5pe1.png', 'media player app']],
  ['Command Prompt', ['/Res/Command Prompt.png', 'command prompt app']],
  ['Minesweeper', ['/Res/Minesweeper.png', 'minesweeper app']],
  ['Notepad', ['/Res/Notepad.png', 'notepad app']],
  ['Paint', ['/Res/Paint.png', 'paint app']],
  ['Github', ['/Res/github-svgrepo-com.svg', 'github link']],
  ['LinkedIn', ['/Res/linkedin-svgrepo-com.svg', 'linkedin link']],
  [
    'Image Viewer',
    ['/Res/Windows Picture and Fax Viewer.png', 'image viewer app'],
  ],
  ['Spider Solitaire', ['/Res/Spider Solitaire.png', 'spider solitaire app']],
  ['Klingon Wiki', ['/Res/main-content-res/960px-Nuvola_Kingon_flag.png', 'klingon wiki']],
]);

export const externalLinks = new Map([
  ['Github', 'https://github.com/dconnorj'],
  ['LinkedIn', 'https://www.linkedin.com/in/cjdalley-swe'],
  ['GitHub', 'https://github.com/dconnorj'], // alias for HTML text mismatch
]);

export const appWindows = new Map([
  ['About Me', document.getElementById('aboutMeWindow')],
  ['Resume', document.getElementById('resumeWindow')],
  ['Projects', document.getElementById('projectsWindow')],
  ['Contact Me', document.getElementById('contactMeWindow')],
  ['Media Player', document.getElementById('mediaPlayerWindow')],
  ['Command Prompt', document.getElementById('commandPromptWindow')],
  ['Image Viewer', document.getElementById('imageViewerWindow')],
  ['Paint', document.getElementById('paintWindow')],
  ['Notepad', document.getElementById('notepadWindow')],
  ['Minesweeper', document.getElementById('minesweeperWindow')],
  ['Spider Solitaire', document.getElementById('solitaireWindow')],
]);

// Confirm dialog
const confirmWindow = document.getElementById('confirmWindow');
const confirmMessage = document.getElementById('confirmMessage');
document.getElementById('confirmYes').addEventListener('click', () => {
  if (pendingUrl) {
    window.open(pendingUrl, '_blank');
    pendingUrl = null;
  }
  confirmWindow.close();
});
document.getElementById('confirmNo').addEventListener('click', () => {
  pendingUrl = null;
  confirmWindow.close();
});

let pendingUrl = null;

export function openExternalLinkConfirm(appName, url) {
  pendingUrl = url;
  confirmMessage.textContent = `You're about to leave this site and open ${appName} in a new tab. Continue?`;
  confirmWindow.setAttribute('title', `Open ${appName}`);
  const entry = image_map.get(appName);
  if (entry) confirmWindow.setAttribute('icon', entry[0]);
  confirmWindow.open();
}

// Desktop icon clicks
const iconMap = {
  '.about_me': 'About Me',
  '.my_resume': 'Resume',
  '.projects': 'Projects',
  '.contact_me': 'Contact Me',
};
Object.entries(iconMap).forEach(([selector, appName]) => {
  const icon = document.querySelector(selector);
  icon.addEventListener('dblclick', () => {
    appWindows.get(appName).open();
    icon.classList.remove('selected');
  });
});

// Delegated click handler for data-app items (start menu, all programs)
document.addEventListener('click', (e) => {
  const item = e.target.closest('[data-app]');
  if (!item) return;
  const appName = item.dataset.app;
  if (externalLinks.has(appName)) {
    openExternalLinkConfirm(appName, externalLinks.get(appName));
  } else if (appWindows.has(appName)) {
    appWindows.get(appName).open();
  } else {
    console.log(`No window or link registered for "${appName}" yet`);
  }
});
