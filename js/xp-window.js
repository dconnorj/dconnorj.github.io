let topZIndex = 100;
let cascadeStep = 0;
let activeWindow = null;

class XPWindow extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'open', 'icon', 'hide-controls'];
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
          display: none !important;
        }
        :host(.maximized) {
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 97% !important;
        }
        .window {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 2px solid #0054e3;
          border-radius: 8px 8px 3px 3px;
          background: #ece9d8;
          box-shadow: 3px 3px 10px rgba(0,0,0,0.5);
          min-width: 500px;
          overflow: hidden;
        }
        :host(.maximized) .window {
          border-radius: 0;
        }
        .window-options img {
          height: 1rem;
          transition: filter 0.2s ease;
          cursor: pointer;
        }
        .window-options img:hover {
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
          user-select: none;
        }
        :host(.maximized) .titlebar {
          border-radius: 0;
        }
        .titlebar .title-text {
          flex: 1;
        }
        .title-icon {
          width: 16px;
          height: 16px;
          display: none;
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
        .resize-handle {
          position: absolute;
          z-index: 10;
        }
        .resize-handle.se { bottom: 0; right: 0; width: 12px; height: 12px; cursor: nwse-resize; }
        .resize-handle.sw { bottom: 0; left: 0;  width: 12px; height: 12px; cursor: nesw-resize; }
        .resize-handle.ne { top: 0;   right: 0;  width: 12px; height: 12px; cursor: nesw-resize; }
        .resize-handle.nw { top: 0;   left: 0;   width: 12px; height: 12px; cursor: nwse-resize; }
        .resize-handle.n  { top: 0;    left: 12px; right: 12px; height: 5px; cursor: ns-resize; }
        .resize-handle.s  { bottom: 0; left: 12px; right: 12px; height: 5px; cursor: ns-resize; }
        .resize-handle.e  { top: 12px; right: 0; bottom: 12px;  width: 5px;  cursor: ew-resize; }
        .resize-handle.w  { top: 12px; left: 0;  bottom: 12px;  width: 5px;  cursor: ew-resize; }
      </style>
      <div class="window">
        <div class="titlebar" part="titlebar">
          <img class="title-icon" part="title-icon">
          <span class="title-text"></span>
          <div class="window-options">
            <img src="Res/Minimize.png" alt="minimize" class="minimize-window">
            <img src="Res/Maximize.png" alt="maximize" class="maximize-window">
            <img src="Res/Exit.png" alt="close" class="close-window">
          </div>
        </div>
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;

    this._restoreState = null;
  }

  get appType() {
    return this.getAttribute('app-type');
  }
  get icon() {
    return this.getAttribute('icon');
  }

  static _activateTopWindow() {
    const windows = document.querySelectorAll('xp-window[open]');
    let top = null,
      topZ = -Infinity;
    windows.forEach((win) => {
      if (win.classList.contains('minimized')) return;
      const z = parseInt(win.style.zIndex || '0', 10);
      if (z > topZ) {
        topZ = z;
        top = win;
      }
    });
    if (top) top.bringToFront();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.title-text').textContent =
      this.getAttribute('title') || 'Window';
    this._updateIcon();
    this._setupWindowControls();
    this._makeDraggable();
    this._makeResizable();
    this.addEventListener('mousedown', () => this.bringToFront());
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'title') {
      const el = this.shadowRoot?.querySelector('.title-text');
      if (el) el.textContent = newVal;
    }
    if (name === 'icon') this._updateIcon();
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
    this.shadowRoot
      .querySelector('.close-window')
      .addEventListener('click', () => this.close());
    this.shadowRoot
      .querySelector('.minimize-window')
      .addEventListener('click', () => this.minimize());
    this.shadowRoot
      .querySelector('.maximize-window')
      .addEventListener('click', () => this.toggleMaximize());
  }

  bringToFront() {
    topZIndex += 1;
    this.style.zIndex = topZIndex;
    if (activeWindow && activeWindow !== this)
      activeWindow.classList.remove('active-window');
    this.classList.add('active-window');
    activeWindow = this;
  }

  open() {
    if (!this._positioned) {
      const offset = (cascadeStep % 8) * 30;
      const taskbarHeight = window.innerHeight * 0.025;
      this.style.top = `${Math.min(100 + offset, window.innerHeight - taskbarHeight - 400)}px`;
      this.style.left = `${Math.min(100 + offset, window.innerWidth - 600)}px`;
      cascadeStep++;
      this._positioned = true;
    }
    this.setAttribute('open', '');
    this.classList.remove('minimized');
    this.bringToFront();
    this.dispatchEvent(
      new CustomEvent('window-opened', {
        detail: { appType: this.appType },
        bubbles: true,
        composed: true,
      })
    );
  }

  close() {
    this.removeAttribute('open');
    this.classList.remove('minimized', 'maximized', 'active-window');
    if (activeWindow === this) {
      activeWindow = null;
      XPWindow._activateTopWindow();
    }
    this.dispatchEvent(
      new CustomEvent('window-closed', {
        detail: { appType: this.appType },
        bubbles: true,
        composed: true,
      })
    );
  }

  minimize() {
    this.classList.add('minimized');
    this.classList.remove('active-window');
    if (activeWindow === this) {
      activeWindow = null;
      XPWindow._activateTopWindow();
    }
    this.dispatchEvent(
      new CustomEvent('window-minimized', {
        detail: { appType: this.appType },
        bubbles: true,
        composed: true,
      })
    );
  }

  toggleMaximize() {
    const maximizeBtn = this.shadowRoot.querySelector('.maximize-window');
    if (this.classList.contains('maximized')) {
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
      this._restoreState = {
        top: this.style.top,
        left: this.style.left,
        width: this.style.width,
        height: this.style.height,
      };
      this.classList.add('maximized');
      maximizeBtn.src = 'Res/Restore.png';
      maximizeBtn.alt = 'restore window';
    }
    this.dispatchEvent(
      new CustomEvent('window-maximized', {
        detail: {
          appType: this.appType,
          maximized: this.classList.contains('maximized'),
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _makeDraggable() {
    const titlebar = this.shadowRoot.querySelector('.titlebar');
    let offsetX,
      offsetY,
      dragging = false;

    titlebar.addEventListener('mousedown', (e) => {
      if (this.classList.contains('maximized')) return;
      dragging = true;
      offsetX = e.clientX - this.offsetLeft;
      offsetY = e.clientY - this.offsetTop;
      this.bringToFront();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const taskbarHeight = window.innerHeight * 0.025;
      this.style.left = `${Math.min(Math.max(0, e.clientX - offsetX), window.innerWidth - this.offsetWidth)}px`;
      this.style.top = `${Math.min(Math.max(0, e.clientY - offsetY), window.innerHeight - taskbarHeight - this.offsetHeight)}px`;
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });
  }

  _makeResizable() {
    const minW = 410,
      minH = 300;
    const windowEl = this.shadowRoot.querySelector('.window');

    ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach((dir) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${dir}`;
      windowEl.appendChild(handle);

      handle.addEventListener('mousedown', (e) => {
        if (this.classList.contains('maximized')) return;
        e.stopPropagation();
        e.preventDefault();
        this.bringToFront();

        const startX = e.clientX,
          startY = e.clientY;
        const startW = this.offsetWidth,
          startH = this.offsetHeight;
        const startLeft = this.offsetLeft,
          startTop = this.offsetTop;

        const onMove = (e) => {
          const dx = e.clientX - startX,
            dy = e.clientY - startY;
          let newW = startW,
            newH = startH,
            newLeft = startLeft,
            newTop = startTop;

          if (dir.includes('e')) newW = Math.max(minW, startW + dx);
          if (dir.includes('s')) newH = Math.max(minH, startH + dy);
          if (dir.includes('w')) {
            newW = Math.max(minW, startW - dx);
            newLeft = startLeft + (startW - newW);
          }
          if (dir.includes('n')) {
            newH = Math.max(minH, startH - dy);
            newTop = startTop + (startH - newH);
          }

          this.style.width = `${newW}px`;
          this.style.height = `${newH}px`;
          this.style.left = `${newLeft}px`;
          this.style.top = `${newTop}px`;
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }
}

customElements.define('xp-window', XPWindow);
export { XPWindow };
