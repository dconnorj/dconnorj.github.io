import { appWindows } from './windows.js';
import { tracks } from './media-player-data.js';

const mediaPlayerWindow = appWindows.get('Media Player');

mediaPlayerWindow
  ?.querySelector('.mp-min-btn')
  ?.addEventListener('click', () => mediaPlayerWindow.minimize());

mediaPlayerWindow
  ?.querySelector('.mp-close-btn')
  ?.addEventListener('click', () => mediaPlayerWindow.close());

const RES = 'Res/9SeriesDefault';

// Swaps an <img>'s src on hover/press. Deliberately JS-driven rather than a
// CSS `:hover { content: url(...) }` rule: that CSS technique was found to
// silently break the browser's native click-event delivery on the element
// (verified — a real click stopped firing once a hover content-swap rule
// applied to it), so plain src-swapping is the reliable choice here.
function wireHoverStates(el, { hover, down } = {}) {
  if (!el) return;
  const base = el.getAttribute('src');
  let isHover = false;
  let isDown = false;
  const render = () => {
    el.src = isDown && down ? down : isHover && hover ? hover : base;
  };
  el.addEventListener('mouseenter', () => {
    isHover = true;
    render();
  });
  el.addEventListener('mouseleave', () => {
    isHover = false;
    render();
  });
  if (down) {
    el.addEventListener('mousedown', () => {
      isDown = true;
      render();
    });
    document.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        render();
      }
    });
  }
}

const audio = mediaPlayerWindow?.querySelector('.mp-audio');
const playPauseBtn = mediaPlayerWindow?.querySelector('.play-pause-btn');
const lastTrackBtn = mediaPlayerWindow?.querySelector('.last-track-btn');
const nextTrackBtn = mediaPlayerWindow?.querySelector('.next-track-btn');
const muteBtn = mediaPlayerWindow?.querySelector('.mute-btn');
const coverArt = mediaPlayerWindow?.querySelector('.music-cover-art');
const trackInfo = mediaPlayerWindow?.querySelector('.mp-track-info');
const trackTitle = mediaPlayerWindow?.querySelector('.track-title');
const trackMarqueeTexts = mediaPlayerWindow?.querySelectorAll(
  '.track-marquee-text'
);
const seekBtnLeft = mediaPlayerWindow?.querySelector('.seek-btn-left');
const seekBtnRight = mediaPlayerWindow?.querySelector('.seek-btn-right');
const seekFill = mediaPlayerWindow?.querySelector('.seek-fill');
const trackBarSlider = mediaPlayerWindow?.querySelector('.track-bar-slider');
const volumeControl = mediaPlayerWindow?.querySelector('.volume-control');
const volumeBar = mediaPlayerWindow?.querySelector('.volume-bar');
const volumeSlider = mediaPlayerWindow?.querySelector('.volume-slider');

wireHoverStates(lastTrackBtn, {
  hover: `${RES}/equalizer_preset_button_left_hover.png`,
  down: `${RES}/equalizer_preset_button_left_down.png`,
});
wireHoverStates(nextTrackBtn, {
  hover: `${RES}/equalizer_preset_button_right_hover.png`,
  down: `${RES}/equalizer_preset_button_right_down.png`,
});
wireHoverStates(muteBtn, { hover: `${RES}/mp-mute-hover.png` });
wireHoverStates(seekBtnLeft, {
  hover: `${RES}/seekbutton_left_hover.png`,
  down: `${RES}/seekbutton_left_down.png`,
});
wireHoverStates(seekBtnRight, {
  hover: `${RES}/seekbutton_right_hover.png`,
  down: `${RES}/seekbutton_right_down.png`,
});
wireHoverStates(trackBarSlider, { hover: `${RES}/track_bar_slider_hover.png` });
wireHoverStates(volumeSlider, { hover: `${RES}/volume_slider_hover.png` });

// --- Playlist (play/pause, next/prev, now-playing info) ---
if (
  audio &&
  playPauseBtn &&
  lastTrackBtn &&
  nextTrackBtn &&
  coverArt &&
  trackInfo &&
  trackTitle &&
  trackMarqueeTexts?.length
) {
  let currentIndex = 0;
  let isPlaying = false;
  let isHover = false;
  let isDown = false;

  const playStates = {
    play: { base: `${RES}/mp-play.png`, hover: `${RES}/mp-play-hover.png` },
    pause: {
      base: `${RES}/transports_pause.png`,
      hover: `${RES}/transports_pause_hover.png`,
      down: `${RES}/transports_pause_down.png`,
    },
  };
  const renderPlayPauseBtn = () => {
    const s = isPlaying ? playStates.pause : playStates.play;
    playPauseBtn.src = isDown && s.down ? s.down : isHover ? s.hover : s.base;
  };
  playPauseBtn.addEventListener('mouseenter', () => {
    isHover = true;
    renderPlayPauseBtn();
  });
  playPauseBtn.addEventListener('mouseleave', () => {
    isHover = false;
    renderPlayPauseBtn();
  });
  playPauseBtn.addEventListener('mousedown', () => {
    isDown = true;
    renderPlayPauseBtn();
  });
  document.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      renderPlayPauseBtn();
    }
  });

  const MARQUEE_SPEED = 40; // px per second, kept consistent across tracks
  const updateMarqueeSpeed = () => {
    // Only measurable once .track-marquee is actually displayed (not display:none).
    const marqueeEl = trackMarqueeTexts[0].parentElement;
    const textWidth = trackMarqueeTexts[0].scrollWidth;
    if (textWidth > 0) {
      // Restart from the beginning: without this, an already-running
      // animation keeps its current scroll position when the text
      // underneath it changes (e.g. switching tracks while playing),
      // making the new text appear to start already scrolled left.
      marqueeEl.style.animation = 'none';
      void marqueeEl.offsetWidth;
      marqueeEl.style.animation = '';
      marqueeEl.style.animationDuration = `${textWidth / MARQUEE_SPEED}s`;
    }
  };

  const setPlaying = (playing) => {
    isPlaying = playing;
    renderPlayPauseBtn();
    trackInfo.classList.toggle('is-playing', playing);
    if (playing) {
      updateMarqueeSpeed();
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const loadTrack = (index, { autoplay } = {}) => {
    currentIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[currentIndex];
    const base = `Res/music/${track.folder}/`;
    audio.src = base + track.file;
    coverArt.src = base + track.cover;
    trackTitle.textContent = track.title;
    trackMarqueeTexts.forEach((el) => (el.textContent = track.credit));
    updateMarqueeSpeed();

    if (autoplay) setPlaying(true);
  };

  playPauseBtn.addEventListener('click', () => setPlaying(!isPlaying));
  lastTrackBtn.addEventListener('click', () =>
    loadTrack(currentIndex - 1, { autoplay: isPlaying })
  );
  nextTrackBtn.addEventListener('click', () =>
    loadTrack(currentIndex + 1, { autoplay: isPlaying })
  );
  audio.addEventListener('ended', () =>
    loadTrack(currentIndex + 1, { autoplay: true })
  );
  mediaPlayerWindow.addEventListener('window-closed', () => {
    setPlaying(false);
    loadTrack(0);
  });

  loadTrack(0);
}

// --- Seek bar (drag/click to scrub, fill shows progress) ---
if (
  trackBarSlider &&
  seekBtnLeft &&
  seekBtnRight &&
  seekFill &&
  trackBarSlider &&
  audio
) {
  const trackBar = mediaPlayerWindow.querySelector('.mp-track-bar');
  let isSeeking = false;

  const getCorridor = () => {
    const start = seekBtnLeft.offsetLeft + seekBtnLeft.offsetWidth;
    const end =
      seekBtnRight.offsetLeft +
      parseFloat(getComputedStyle(seekBtnRight).paddingLeft);
    return { start, width: end - start };
  };

  const render = (fraction) => {
    const clamped = Math.min(1, Math.max(0, fraction));
    const { start, width } = getCorridor();
    const sliderWidth = trackBarSlider.offsetWidth;
    seekFill.style.left = `${start}px`;
    seekFill.style.width = `${clamped * width}px`;
    trackBarSlider.style.left = `${
      clamped * Math.max(0, width - sliderWidth)
    }px`;
  };

  const setSeekFromClientX = (clientX) => {
    const rect = trackBar.getBoundingClientRect();
    const { start, width } = getCorridor();
    const fraction = (clientX - rect.left - start) / width;
    const clamped = Math.min(1, Math.max(0, fraction));
    render(clamped);
    if (audio.duration) audio.currentTime = clamped * audio.duration;
  };

  const onPointerMove = (e) => setSeekFromClientX(e.clientX);
  const onPointerUp = () => {
    isSeeking = false;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  trackBar.addEventListener('pointerdown', (e) => {
    // The rewind/fast-forward buttons at either end have their own
    // click behavior (skip ±15s) — don't also scrub to their position.
    if (e.target === seekBtnLeft || e.target === seekBtnRight) return;
    isSeeking = true;
    setSeekFromClientX(e.clientX);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    e.preventDefault();
  });

  const SKIP_SECONDS = 15;
  seekBtnLeft.addEventListener('click', () => {
    audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);
    if (audio.duration) render(audio.currentTime / audio.duration);
  });
  seekBtnRight.addEventListener('click', () => {
    const upperBound = Number.isFinite(audio.duration)
      ? audio.duration
      : Infinity;
    audio.currentTime = Math.min(upperBound, audio.currentTime + SKIP_SECONDS);
    if (audio.duration) render(audio.currentTime / audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (isSeeking || !audio.duration) return;
    render(audio.currentTime / audio.duration);
  });

  audio.addEventListener('loadedmetadata', () => {
    if (!isSeeking) render(audio.currentTime / (audio.duration || 1));
  });
}

// --- Volume slider (drag/click to set volume, transparent past the slider) ---
if (volumeControl && volumeBar && volumeSlider && audio) {
  const renderVolume = (fraction) => {
    const trackWidth = volumeBar.offsetWidth;
    const sliderWidth = volumeSlider.offsetWidth;
    const clamped = Math.min(1, Math.max(0, fraction));
    const fillWidth = clamped * trackWidth;
    volumeBar.style.clipPath = `inset(0 ${trackWidth - fillWidth}px 0 0)`;
    const sliderLeft = Math.min(
      trackWidth - sliderWidth,
      Math.max(0, fillWidth - sliderWidth / 2)
    );
    volumeSlider.style.left = `${sliderLeft}px`;
  };

  const setVolume = (fraction) => {
    const clamped = Math.min(1, Math.max(0, fraction));
    audio.volume = clamped;
    renderVolume(clamped);
  };

  const updateFromClientX = (clientX) => {
    const rect = volumeBar.getBoundingClientRect();
    setVolume((clientX - rect.left) / rect.width);
  };

  const onPointerMove = (e) => updateFromClientX(e.clientX);
  const onPointerUp = () => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  volumeControl.addEventListener('pointerdown', (e) => {
    updateFromClientX(e.clientX);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    e.preventDefault();
  });

  mediaPlayerWindow.addEventListener('window-opened', () => setVolume(1));

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      renderVolume(audio.muted ? 0 : audio.volume);
    });
  }
}
