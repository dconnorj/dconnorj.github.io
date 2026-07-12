// Boot sequence: black screen -> "press any key to start" (boot gif loops
// behind it) -> the instant the user presses/clicks, the desktop reveals
// (+ startup sound) -> welcome popup (+ balloon sound) ~5s after that press.
//
// The gif is the "waiting for input" animation, not a timed intro, so there's
// no artificial delay after the gesture - we only wait on whenPageFullyLoaded(),
// which is normally already resolved by the time the user presses anything.
// That still guards against the "elements popping in" glitch on a slow load,
// without adding perceptible lag on a fast one.
//
// Browsers block audio.play() until the page has had a user gesture, so the
// sequence waits for a click/tap/keypress before it starts. Once that
// gesture has happened anywhere on the page, browsers treat the whole
// session as "activated" and allow later play() calls (the startup sound
// right after, the balloon sound 5s after that) without needing each call
// to be synchronously inside a gesture handler itself.
const POPUP_DELAY_FROM_CLICK_MS = 5000; // welcome popup appears ~5s after the press
const MIN_POPUP_GAP_MS = 500; // floor so the popup never lands right on top of the reveal

const bootScreen = document.getElementById('bootScreen');
const bootPrompt = document.getElementById('bootPrompt');
const mainSection = document.querySelector('.main_section');

const startupSound = new Audio('/Res/xp-sounds/windows-xp-startup.mp3');
const balloonSound = new Audio('/Res/xp-sounds/windows-xp-balloon-sound.mp3');
balloonSound.volume = 0.8;

function playSound(audio) {
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function whenPageFullyLoaded() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });
}

function whenUserGesture() {
  return new Promise((resolve) => {
    const events = ['pointerdown', 'keydown'];
    const onGesture = () => {
      events.forEach((evt) => document.removeEventListener(evt, onGesture));
      resolve();
    };
    events.forEach((evt) =>
      document.addEventListener(evt, onGesture, { once: true })
    );
  });
}

async function runBootSequence() {
  await whenUserGesture();
  const clickTime = Date.now();
  bootPrompt.classList.add('boot-hidden');

  await whenPageFullyLoaded();

  mainSection.classList.remove('is-loading');
  bootScreen.classList.add('boot-hidden');
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
