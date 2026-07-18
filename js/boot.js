// Boot sequence: boot video plays once -> select-profile screen -> user
// clicks their name -> welcome screen -> desktop reveals with the startup
// sound, followed by the balloon popup a few seconds later.
//
// Browsers block audio.play() until the page has had a user gesture. The
// profile click is that gesture, so it both advances the sequence and
// unlocks the startup/balloon sounds that play after it.
const VIDEO_FALLBACK_MS = 3500; // safety net in case autoplay is blocked and 'ended' never fires
const WELCOME_SCREEN_MS = 2200; // how long the "welcome" screen stays up before the desktop reveals
const POPUP_DELAY_FROM_CLICK_MS = 7000; // balloon popup appears ~7s after the profile click
const MIN_POPUP_GAP_MS = 2000; // floor so the popup waits at least 2s after the desktop reveals

const bootScreen = document.getElementById('bootScreen');
const bootVideo = document.querySelector('.boot_gif');
const selectScreen = document.getElementById('selectScreen');
const selectProfileBtn = document.getElementById('selectProfileBtn');
const welcomeScreen = document.getElementById('welcomeScreen');
const mainSection = document.querySelector('.main_section');

const startupSound = new Audio('/Res/xp-sounds/windows-xp-startup.mp3');
const balloonSound = new Audio('/Res/xp-sounds/windows-xp-balloon-sound.mp3');
balloonSound.volume = 0.8;

function playSound(audio) {
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function whenPageFullyLoaded() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });
}

function whenVideoEnds() {
  return new Promise((resolve) => {
    bootVideo.addEventListener('ended', () => resolve(), { once: true });
    setTimeout(resolve, VIDEO_FALLBACK_MS);
  });
}

function whenProfileClicked() {
  return new Promise((resolve) => {
    selectProfileBtn.addEventListener('click', () => resolve(), { once: true });
  });
}

async function runBootSequence() {
  await Promise.all([whenPageFullyLoaded(), whenVideoEnds()]);
  bootScreen.classList.add('boot-hidden');
  selectScreen.classList.add('screen-active');

  await whenProfileClicked();
  const clickTime = Date.now();
  selectScreen.classList.remove('screen-active');
  welcomeScreen.classList.add('screen-active');

  await wait(WELCOME_SCREEN_MS);

  welcomeScreen.classList.remove('screen-active');
  mainSection.classList.remove('is-loading');
  playSound(startupSound);
  document.dispatchEvent(new Event('xp-boot-complete'));

  const elapsedSinceClick = Date.now() - clickTime;
  const popupDelay = Math.max(
    POPUP_DELAY_FROM_CLICK_MS - elapsedSinceClick,
    MIN_POPUP_GAP_MS
  );
  setTimeout(() => {
    playSound(balloonSound);
    document.dispatchEvent(new Event('xp-show-welcome'));
  }, popupDelay);
}

runBootSequence();
