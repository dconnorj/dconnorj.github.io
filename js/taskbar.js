const startApps = document.querySelector('.start_apps');
const taskbarTabs = new Map();

function getWindowTitle(win) {
  return win.getAttribute('title') || win.appType || 'Window';
}

function setActiveTab(appType) {
  taskbarTabs.forEach((tab, type) =>
    tab.classList.toggle('active', type === appType)
  );
}

function clearActiveTabs() {
  taskbarTabs.forEach((tab) => tab.classList.remove('active'));
}

document.addEventListener('window-opened', (e) => {
  const win = e.target;
  const appType = e.detail.appType;
  if (!appType) return;

  if (taskbarTabs.has(appType)) {
    setActiveTab(appType);
    return;
  }

  const tab = document.createElement('button');
  tab.classList.add('taskbar_tab', 'active');

  if (win.icon) {
    const img = document.createElement('img');
    img.src = win.icon;
    img.alt = `${appType} icon`;
    tab.appendChild(img);
  }

  const label = document.createElement('span');
  label.textContent = getWindowTitle(win);
  tab.appendChild(label);

  tab.addEventListener('click', () => {
    if (win.classList.contains('minimized')) {
      win.classList.remove('minimized');
      win.bringToFront();
      setActiveTab(appType);
    } else if (tab.classList.contains('active')) {
      win.minimize();
    } else {
      win.bringToFront();
      setActiveTab(appType);
    }
  });

  clearActiveTabs();
  tab.classList.add('active');
  taskbarTabs.set(appType, tab);
  startApps.appendChild(tab);
});

document.addEventListener('window-closed', (e) => {
  const tab = taskbarTabs.get(e.detail.appType);
  if (tab) {
    tab.remove();
    taskbarTabs.delete(e.detail.appType);
  }
});

document.addEventListener('window-minimized', (e) => {
  taskbarTabs.get(e.detail.appType)?.classList.remove('active');
});
