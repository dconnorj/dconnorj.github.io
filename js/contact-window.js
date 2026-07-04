import { appWindows, externalLinks, openExternalLinkConfirm } from './windows.js';

const contactMeWindow = appWindows.get('Contact Me');

document
  .querySelector('.cm-linkedin-btn')
  .addEventListener('click', () =>
    openExternalLinkConfirm('LinkedIn', externalLinks.get('LinkedIn'))
  );

// The message box is a contenteditable div (not a textarea) so it has no
// native scrollbar; keep its content synced into the hidden field Formspree reads.
const cmMessageEl = document.querySelector('.cm-message');
const cmMessageHidden = document.getElementById('cmMessageHidden');
cmMessageEl.addEventListener('input', () => {
  cmMessageHidden.value = cmMessageEl.textContent;
});

// Contact form submission (Formspree)
const cmForm = document.getElementById('cmForm');
const cmFooterText = document.querySelector('.cm-footer p');
const cmSendBtn = document.querySelector('.cm-send-btn');
const cmNewBtn = document.querySelector('.cm-new-btn');
const cmFromInput = document.querySelector('.cm-from-input');
const cmSubjectInput = document.querySelector('.cm-subject-input');
const cmFooterDefault = cmFooterText.textContent;

// Send/New Message stay disabled until the user has typed something somewhere in the form.
function hasMessageContent() {
  return (
    cmFromInput.value.trim() !== '' ||
    cmSubjectInput.value.trim() !== '' ||
    cmMessageEl.textContent.trim() !== ''
  );
}
function updateMessageBtnsState() {
  const active = hasMessageContent();
  cmSendBtn.disabled = !active;
  cmNewBtn.disabled = !active;
}
cmFromInput.addEventListener('input', updateMessageBtnsState);
cmSubjectInput.addEventListener('input', updateMessageBtnsState);
cmMessageEl.addEventListener('input', updateMessageBtnsState);

// Balloon-tip style popup confirming whether the message sent or failed
const cmToast = document.createElement('div');
cmToast.className = 'cm-toast';
cmToast.innerHTML = `
  <div class="cm-toast-header">
    <img src="Res/Outlook Express.png" alt="" />
    <p class="cm-toast-title">Outlook Express</p>
    <span class="cm-toast-close">&times;</span>
  </div>
  <div class="cm-toast-body">
    <img class="cm-toast-icon" alt="" />
    <p class="cm-toast-message"></p>
  </div>`;
document.body.appendChild(cmToast);

const cmToastIcon = cmToast.querySelector('.cm-toast-icon');
const cmToastMessage = cmToast.querySelector('.cm-toast-message');
let cmToastTimer = null;

function hideCmToast() {
  cmToast.classList.remove('show');
}
function showCmToast(message, isError) {
  cmToastIcon.src = isError ? 'Res/Security Error.png' : 'Res/Information.png';
  cmToastMessage.textContent = message;
  cmToast.classList.add('show');
  clearTimeout(cmToastTimer);
  cmToastTimer = setTimeout(hideCmToast, 5000);
}
cmToast.querySelector('.cm-toast-close').addEventListener('click', hideCmToast);

cmForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!cmForm.reportValidity()) return;
  if (!cmMessageHidden.value.trim()) {
    cmMessageEl.focus();
    return;
  }

  cmSendBtn.disabled = true;
  cmFooterText.textContent = 'Sending message...';

  try {
    const response = await fetch(cmForm.action, {
      method: 'POST',
      body: new FormData(cmForm),
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      cmFooterText.textContent = 'Message sent. Thanks for reaching out!';
      showCmToast('Your message was sent. Thanks for reaching out!', false);
      cmForm.reset();
    } else {
      cmFooterText.textContent = 'Something went wrong. Please try again.';
      showCmToast('Your message could not be sent. Please try again.', true);
    }
  } catch {
    cmFooterText.textContent = 'Something went wrong. Please try again.';
    showCmToast('Your message could not be sent. Please try again.', true);
  } finally {
    updateMessageBtnsState();
  }
});

cmForm.addEventListener('reset', () => {
  cmFooterText.textContent = cmFooterDefault;
  cmMessageEl.textContent = '';
  cmMessageHidden.value = '';
  // native inputs haven't reset yet at this point in the event's default action; defer.
  setTimeout(updateMessageBtnsState, 0);
});

// File/View dropdown menus
function getFileMenuItems() {
  const disabledClass = hasMessageContent() ? '' : ' cm-file-disabled';
  return `
    <div class="cm-file-popup-btns">
      <p class="cm-file-new${disabledClass}">New Message</p>
      <p class="cm-file-send cm-file-border${disabledClass}">Send Message</p>
      <p class="cm-file-disabled cm-file-border">Print</p>
      <p class="cm-file-exit">Exit</p>
    </div>`;
}

function getViewMenuItems() {
  const isMaximized = contactMeWindow.classList.contains('maximized');
  return `
    <div class="cm-view-popup-btns">
      <p class="cm-view-max">${isMaximized ? 'Restore' : 'Maximize'}</p>
      <p class="cm-view-min">Minimize</p>
    </div>`;
}

const cmDropdown = document.createElement('div');
cmDropdown.classList.add('cm-dropdown-menu');
cmDropdown.style.display = 'none';
document.body.appendChild(cmDropdown);

let cmMenuOpen = false;

function openCmMenu(btn, content) {
  const rect = btn.getBoundingClientRect();
  cmDropdown.innerHTML = content;
  cmDropdown.style.display = 'block';
  cmDropdown.style.left = `${rect.left}px`;
  cmDropdown.style.top = `${rect.bottom}px`;
  cmMenuOpen = true;
}

function closeCmMenu() {
  cmDropdown.style.display = 'none';
  cmMenuOpen = false;
}

const cmFileBtn = document.querySelector('.cm-file');
const cmViewBtn = document.querySelector('.cm-view');

cmFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  cmMenuOpen ? closeCmMenu() : openCmMenu(cmFileBtn, getFileMenuItems());
});
cmViewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  cmMenuOpen ? closeCmMenu() : openCmMenu(cmViewBtn, getViewMenuItems());
});
cmFileBtn.addEventListener('mouseenter', () => {
  if (cmMenuOpen) openCmMenu(cmFileBtn, getFileMenuItems());
});
cmViewBtn.addEventListener('mouseenter', () => {
  if (cmMenuOpen) openCmMenu(cmViewBtn, getViewMenuItems());
});

document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.cm-dropdown-menu') &&
    !e.target.closest('.cm-file') &&
    !e.target.closest('.cm-view')
  ) {
    closeCmMenu();
  }
});

cmDropdown.addEventListener('click', (e) => {
  const target = e.target.closest('p');
  if (!target) return;
  if (target.classList.contains('cm-file-exit')) contactMeWindow.close();
  if (target.classList.contains('cm-file-new')) cmNewBtn.click();
  if (target.classList.contains('cm-file-send')) cmSendBtn.click();
  if (target.classList.contains('cm-view-max')) contactMeWindow.toggleMaximize();
  if (target.classList.contains('cm-view-min')) contactMeWindow.minimize();
  closeCmMenu();
});
