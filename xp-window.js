let topZIndex = 100;
let cascadeStep = 0;
let activeWindow = null;

class XPWindow extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'open', 'icon'];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 100px;
          left: 100px;
          width: 50rem;
          height: 35rem;
          display: none;
          z-index: 100;
          font-family: Tahoma, sans-serif;
        }
        :host([open]) {
          display: block;
        }
        :host(.minimized) {
          display: none;
        }
        :host(.maximized) {
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 97% !important;
          bottom: 2.5% !important;
        }
        .window {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 2px solid #0054e3;
          border-radius: 8px 8px 3px 3px;
          background: #ece9d8;
          box-shadow: 3px 3px 10px rgba(0,0,0,0.5);
          min-width: 250px;
          overflow: hidden;
        }
        :host(.maximized) .window {
          border-radius: 0;
        }
        .window-options img{
          height: 1rem;
          transition: filter 0.2s ease;
          cursor: pointer;
        }
        .window-options img:hover{
          filter: brightness(1.3);
        }
        
        :host(:not(.active-window)) .titlebar {
          opacity: 0.5;
          pointer-events: none;
        }
        .titlebar {
          background: linear-gradient(to bottom, #3B73E8 0%, #245EDC 40%, #1A4FC4 100%);
          color: white;
          padding: 4px 6px;
          border-radius: 6px 6px 0 0;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: move;
          font-weight: bold;
          font-size: 13px;
          text-shadow: 1px 1px 1px black;
        }
        :host(.maximized) .titlebar {
          border-radius: 0;
        }
        .titlebar .title-text {
          flex: 1; /* pushes buttons to the right */
        }
        .title-icon {
          width: 16px;
          height: 16px;
          display: none; /* hidden until an icon attribute is set */
        }
        .content {
          flex: 1;
          background: white;
          overflow: auto;
        }
        :host([hide-controls]) .minimize-window,
        :host([hide-controls]) .maximize-window {
          display: none;
        }
      </style>
      <div class="window">
        <div class="titlebar" part="titlebar">
          <img class="title-icon" part="title-icon">
          <span class="title-text"></span>
          <div class="window-options">
            <img src="Res/Minimize.png" alt="minimize window" class="minimize-window">
            <img src="Res/Maximize.png" alt="maximize window" class="maximize-window">
            <img src="Res/Exit.png" alt="exit window" class="close-window">
          </div>
        </div>
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;

    // store last position/size so we can restore from maximized
    this._restoreState = null;
  }

  // Convenience getters for reading custom attributes
  get appType() {
    return this.getAttribute('app-type');
  }

  get icon() {
    return this.getAttribute('icon');
  }

  static _activateTopWindow() {
  const windows = document.querySelectorAll('xp-window[open]');
  let top = null;
  let topZ = -Infinity;

  windows.forEach(win => {
    if (win.classList.contains('minimized')) return;
    const z = parseInt(win.style.zIndex || '0', 10);
    if (z > topZ) {
      topZ = z;
      top = win;
    }
  });

  if (top) {
    top.bringToFront();
  }
}

  connectedCallback() {
    this.shadowRoot.querySelector('.title-text').textContent =
      this.getAttribute('title') || 'Window';

    this._updateIcon();
    this._setupWindowControls();
    this._makeDraggable();

    // Bring to front on any click within the window
    this.addEventListener('mousedown', () => this.bringToFront());
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'title') {
      const el = this.shadowRoot.querySelector('.title-text');
      if (el) el.textContent = newVal;
    }
    if (name === 'icon') {
      this._updateIcon();
    }
  }

  _updateIcon() {
    const iconEl = this.shadowRoot.querySelector('.title-icon');
    if (!iconEl) return;

    if (this.icon) {
      iconEl.src = this.icon;
      iconEl.alt = `${this.appType || 'app'} icon`;
      iconEl.style.display = 'inline-block';
    } else {
      iconEl.style.display = 'none';
    }
  }

  _setupWindowControls() {
    const closeBtn = this.shadowRoot.querySelector('.close-window');
    const minimizeBtn = this.shadowRoot.querySelector('.minimize-window');
    const maximizeBtn = this.shadowRoot.querySelector('.maximize-window');

    closeBtn.addEventListener('click', () => this.close());
    minimizeBtn.addEventListener('click', () => this.minimize());
    maximizeBtn.addEventListener('click', () => this.toggleMaximize());
  }

  bringToFront() {
  topZIndex += 1;
  this.style.zIndex = topZIndex;

  if (activeWindow && activeWindow !== this) {
    activeWindow.classList.remove('active-window');
  }
  this.classList.add('active-window');
  activeWindow = this;
}

  open() {
     // only position on first open, so reopening doesn't re-cascade
    if (!this._positioned) {
      const offset = (cascadeStep % 8) * 30; // wrap after 8 windows
      this.style.top = `${100 + offset}px`;
      this.style.left = `${100 + offset}px`;
      cascadeStep++;
      this._positioned = true;
    }

    this.setAttribute('open', '');
    this.classList.remove('minimized');
    this.bringToFront();

    this.dispatchEvent(new CustomEvent('window-opened', {
      detail: { appType: this.appType },
      bubbles: true,
      composed: true
    }));
  }

  close() {
  this.removeAttribute('open');
  this.classList.remove('minimized', 'maximized', 'active-window');
  if (activeWindow === this) {
    activeWindow = null;
    XPWindow._activateTopWindow();
  }
  this.dispatchEvent(new CustomEvent('window-closed', {
    detail: { appType: this.appType },
    bubbles: true,
    composed: true
  }));
}

  minimize() {
  this.classList.add('minimized');
  this.classList.remove('active-window');
  if (activeWindow === this) {
    activeWindow = null;
    XPWindow._activateTopWindow();
  }
  this.dispatchEvent(new CustomEvent('window-minimized', {
    detail: { appType: this.appType },
    bubbles: true,
    composed: true
  }));
}

  toggleMaximize() {
    const maximizeBtn = this.shadowRoot.querySelector('.maximize-window');

    if (this.classList.contains('maximized')) {
      // restore
      this.classList.remove('maximized');
      if (this._restoreState) {
        this.style.top = this._restoreState.top;
        this.style.left = this._restoreState.left;
        this.style.width = this._restoreState.width;
        this.style.height = this._restoreState.height;
      }
      maximizeBtn.src = 'Res/Maximize.png';
      maximizeBtn.alt = 'maximize window';
    } else {
      // save current position/size before maximizing
      this._restoreState = {
        top: this.style.top,
        left: this.style.left,
        width: this.style.width,
        height: this.style.height
      };
      this.classList.add('maximized');
      maximizeBtn.src = 'Res/Restore.png';
      maximizeBtn.alt = 'restore window';
    }

    this.dispatchEvent(new CustomEvent('window-maximized', {
      detail: {
        appType: this.appType,
        maximized: this.classList.contains('maximized')
      },
      bubbles: true,
      composed: true
    }));
  }

  _makeDraggable() {
    const titlebar = this.shadowRoot.querySelector('.titlebar');
    let offsetX, offsetY, dragging = false;

    titlebar.addEventListener('mousedown', (e) => {
      if (this.classList.contains('maximized')) return; // don't drag while maximized
      dragging = true;
      offsetX = e.clientX - this.offsetLeft;
      offsetY = e.clientY - this.offsetTop;
      this.bringToFront();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      this.style.left = `${e.clientX - offsetX}px`;
      this.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });
  }
  static get observedAttributes() {
    return ['title', 'open', 'icon', 'hide-controls'];
  }
}

customElements.define('xp-window', XPWindow);
export { XPWindow };