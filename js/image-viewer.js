import { appWindows } from './windows.js';
import { images } from './image-viewer-data.js';

const imageViewerWindow = appWindows.get('Image Viewer');

const ivImageArea = imageViewerWindow?.querySelector('.iv-image-area');
const ivImage = imageViewerWindow?.querySelector('.iv-image');
const ivBackBtn = imageViewerWindow?.querySelector('.iv-back-btn');
const ivForwardBtn = imageViewerWindow?.querySelector('.iv-forward-btn');
const ivZoomBtn = imageViewerWindow?.querySelector('.iv-zoom-btn');

const RES = 'Res/birds';
// These photos are ~640px wide, often smaller than their fit-to-window
// size on a large screen — a literal "actual size" zoom would shrink
// them instead of enlarging them. Scale up from whatever size is
// currently on screen instead, so zoom always expands the image.
const ZOOM_FACTOR = 2;

if (
  imageViewerWindow &&
  ivImageArea &&
  ivImage &&
  ivBackBtn &&
  ivForwardBtn &&
  ivZoomBtn
) {
  let currentIndex = 0;

  function setZoomed(isZoomed) {
    if (isZoomed) {
      const rect = ivImage.getBoundingClientRect();
      ivImage.style.width = `${rect.width * ZOOM_FACTOR}px`;
      ivImage.style.height = `${rect.height * ZOOM_FACTOR}px`;
    } else {
      ivImage.style.width = '';
      ivImage.style.height = '';
    }
    ivImageArea.classList.toggle('zoomed', isZoomed);
    ivZoomBtn.classList.toggle('active', isZoomed);
  }

  function loadImage(index) {
    currentIndex = ((index % images.length) + images.length) % images.length;
    const image = images[currentIndex];
    ivImage.src = `${RES}/${image.file}`;
    ivImage.alt = image.name;
    imageViewerWindow.setAttribute(
      'title',
      `${image.name} by ${image.artist} - Image Viewer`
    );
    setZoomed(false);
  }

  ivBackBtn.addEventListener('click', () => loadImage(currentIndex - 1));
  ivForwardBtn.addEventListener('click', () => loadImage(currentIndex + 1));
  ivZoomBtn.addEventListener('click', () =>
    setZoomed(!ivImageArea.classList.contains('zoomed'))
  );

  imageViewerWindow.addEventListener('window-closed', () => loadImage(0));

  loadImage(0);
}
