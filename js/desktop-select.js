// Rubber-band selection box for the desktop, like clicking and dragging
// on empty space in a normal desktop UI.
const desktop = document.querySelector('.main_section');

let selectionBox = null;
let startX = 0;
let startY = 0;
let isSelecting = false;

function updateBox(x1, y1, x2, y2) {
  selectionBox.style.left = `${Math.min(x1, x2)}px`;
  selectionBox.style.top = `${Math.min(y1, y2)}px`;
  selectionBox.style.width = `${Math.abs(x2 - x1)}px`;
  selectionBox.style.height = `${Math.abs(y2 - y1)}px`;
}

function updateIconSelection() {
  const boxRect = selectionBox.getBoundingClientRect();
  document.querySelectorAll('.icons button').forEach((icon) => {
    const iconRect = icon.getBoundingClientRect();
    const intersects = !(
      iconRect.right < boxRect.left ||
      iconRect.left > boxRect.right ||
      iconRect.bottom < boxRect.top ||
      iconRect.top > boxRect.bottom
    );
    icon.classList.toggle('selected', intersects);
  });
}

function clearSelection() {
  document
    .querySelectorAll('.icons button.selected')
    .forEach((icon) => icon.classList.remove('selected'));
}

desktop.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (e.target.closest('.icons button') || e.target.closest('xp-window')) return;

  isSelecting = true;
  const rect = desktop.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;

  clearSelection();
  selectionBox = document.createElement('div');
  selectionBox.className = 'desktop_selection_box';
  desktop.appendChild(selectionBox);
  updateBox(startX, startY, startX, startY);
});

document.addEventListener('mousemove', (e) => {
  if (!isSelecting) return;
  const rect = desktop.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  updateBox(startX, startY, currentX, currentY);
  updateIconSelection();
});

document.addEventListener('mouseup', () => {
  if (!isSelecting) return;
  isSelecting = false;
  selectionBox?.remove();
  selectionBox = null;
});

// A plain click on a single icon selects just that icon (opening is a
// double-click, handled elsewhere) and stays highlighted until the user
// clicks away.
document.querySelectorAll('.icons button').forEach((icon) => {
  icon.addEventListener('click', () => {
    clearSelection();
    icon.classList.add('selected');
  });
});
