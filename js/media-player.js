import { appWindows } from './windows.js';

const mediaPlayerWindow = appWindows.get('Media Player');

mediaPlayerWindow
  ?.querySelector('.mp-min-btn')
  ?.addEventListener('click', () => mediaPlayerWindow.minimize());

mediaPlayerWindow
  ?.querySelector('.mp-close-btn')
  ?.addEventListener('click', () => mediaPlayerWindow.close());
