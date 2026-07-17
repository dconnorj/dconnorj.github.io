import './js/boot.js';
import './js/xp-window.js';
import { loadWindows } from './js/loader.js';

// Window content is fetched from windows/*.html, so anything that queries
// inside a window (windows.js, am-window.js, etc.) has to wait for it to land.
await loadWindows();

await Promise.all([
  import('./js/start-menu.js'),
  import('./js/tray.js'),
  import('./js/taskbar.js'),
  import('./js/windows.js'),
  import('./js/am-window.js'),
  import('./js/resume-window.js'),
  import('./js/contact-window.js'),
  import('./js/projects-window.js'),
  import('./js/media-player.js'),
  import('./js/command-prompt.js'),
  import('./js/image-viewer.js'),
  import('./js/paint-window.js'),
  import('./js/notepad-window.js'),
  import('./js/minesweeper-window.js'),
  import('./js/solitaire-window.js'),
]);
