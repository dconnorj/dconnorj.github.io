import { appWindows } from './windows.js';
import {
  createFileSystem,
  resolvePath as fsResolvePath,
  getNode as fsGetNode,
  realParts as fsRealParts,
  formatPath as fsFormatPath,
  containsCritical,
  collectDomEffects,
  countFiles,
  countDirs,
  deepClone,
  tokenize,
  extractFlags,
  makeDir,
} from './command-prompt-fs.js';

const cmdWindow = appWindows.get('Command Prompt');
const screen = cmdWindow?.querySelector('[data-cmd-screen]');
const linesContainer = cmdWindow?.querySelector('.cmd-lines');

const VERSION_LINE = 'ConnorDalley XP v1.0 (Jul 2026)';
const pageLoadTime = Date.now();

// The file system persists for the whole page session (surviving window
// close/reopen) since it represents "the disk" - only a hard reload resets it.
const root = createFileSystem();

const COLORS = {
  0: '#000000',
  1: '#0000AA',
  2: '#00AA00',
  3: '#00AAAA',
  4: '#AA0000',
  5: '#AA00AA',
  6: '#AA5500',
  7: '#AAAAAA',
  8: '#555555',
  9: '#5555FF',
  A: '#55FF55',
  B: '#55FFFF',
  C: '#FF5555',
  D: '#FF55FF',
  E: '#FFFF55',
  F: '#FFFFFF',
};

function defaultEnv() {
  return {
    OS: 'Windows_XP',
    COMPUTERNAME: 'CONNOR-PC',
    USERNAME: 'Connor',
    USERPROFILE: 'C:\\Users\\Connor',
    WINDIR: 'C:\\Windows',
    PATH: 'C:\\Windows\\system32;C:\\Windows',
    PROMPT: '$P$G',
  };
}

let cwd = ['C:', 'Users', 'Connor'];
let mode = 'normal'; // 'normal' | 'diskpart'
let echoOn = true;
let env = defaultEnv();

let currentLineEl = null;
let inputEl = null;

// ---------- low-level terminal rendering ----------

function appendLine(text = '') {
  const div = document.createElement('div');
  div.className = 'cmd-line';
  div.textContent = text;
  linesContainer.appendChild(div);
}

function appendLines(text) {
  text.split('\n').forEach(appendLine);
}

function scrollToBottom() {
  screen.scrollTop = screen.scrollHeight;
}

function promptText() {
  if (mode === 'diskpart') return 'DISKPART> ';
  return `${fsFormatPath(cwd)}> `;
}

function newPromptLine() {
  currentLineEl = document.createElement('div');
  currentLineEl.className = 'cmd-current-line';

  const promptEl = document.createElement('span');
  promptEl.className = 'cmd-prompt';
  promptEl.textContent = promptText();

  inputEl = document.createElement('input');
  inputEl.className = 'cmd-input';
  inputEl.type = 'text';
  inputEl.autocomplete = 'off';
  inputEl.spellcheck = false;
  inputEl.addEventListener('keydown', onKeydown);

  currentLineEl.append(promptEl, inputEl);
  linesContainer.appendChild(currentLineEl);
  inputEl.focus();
  scrollToBottom();
}

function onKeydown(e) {
  if (e.key !== 'Enter') return;
  const value = inputEl.value;
  const trimmedValue = value.trim();
  const promptSnapshot = promptText();

  if (mode === 'normal' && (trimmedValue === 'cls' || trimmedValue === 'clear')) {
    linesContainer.innerHTML = '';
    newPromptLine();
    return;
  }

  currentLineEl.classList.remove('cmd-current-line');
  currentLineEl.classList.add('cmd-line');
  currentLineEl.textContent = `${promptSnapshot}${value}`;

  const result =
    mode === 'diskpart' ? runDiskpartCommand(value) : runCommand(value);

  if (result !== 'halt') {
    appendLine('');
    newPromptLine();
  }
}

// ---------- full-screen overlays (BSOD / shutdown) ----------

function buildFullscreenOverlay(id) {
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999999;
    display: flex; align-items: center; justify-content: center;
    font-family: Tahoma, sans-serif; text-align: left;
  `;
  document.body.appendChild(overlay);
  return overlay;
}

const STOP_MESSAGES = {
  INACCESSIBLE_BOOT_DEVICE: {
    code: '0x0000007B',
    extra: '0xF78D2524, 0xC0000034, 0x00000000, 0x00000000',
  },
  CRITICAL_PROCESS_DIED: {
    code: '0x000000EF',
    extra: '0x8A3E2030, 0x00000000, 0x00000000, 0x00000000',
  },
};

function triggerBSOD(reason) {
  if (document.getElementById('cmd-bsod-overlay')) return;
  const info = STOP_MESSAGES[reason] || STOP_MESSAGES.INACCESSIBLE_BOOT_DEVICE;
  const overlay = buildFullscreenOverlay('cmd-bsod-overlay');
  overlay.style.background = '#0000AA';
  overlay.style.color = '#fff';

  overlay.innerHTML = `
    <div style="max-width: 44rem; font-family: 'Lucida Console', Consolas, monospace; font-size: 0.95rem; line-height: 1.6; padding: 2rem;">
      <p>A problem has been detected and Windows has been shut down to prevent damage to your computer.</p>
      <p>${reason}</p>
      <p>If this is the first time you've seen this stop error screen, restart your computer. If this screen appears again, follow these steps:</p>
      <p>Check to make sure any new hardware or software is properly installed. If this is a new installation, ask your hardware or software manufacturer for any Windows updates you might need.</p>
      <p>If problems continue, disable or remove any newly installed hardware or software. Disable BIOS memory options such as caching or shadowing. If you need to use Safe Mode to remove or disable components, restart your computer, press F8 to select Advanced Startup Options, and then select Safe Mode.</p>
      <p>Technical information:</p>
      <p>*** STOP: ${info.code} (${info.extra})</p>
      <br>
      <p>Press any key to restart . . .</p>
    </div>
  `;

  const dismiss = () => location.reload();
  overlay.addEventListener('click', dismiss);
  // Deferred: triggerBSOD can run synchronously inside the same Enter
  // keydown that invoked it, and that event is still bubbling toward
  // document - attaching immediately would let it dismiss itself.
  setTimeout(() => document.addEventListener('keydown', dismiss, { once: true }), 0);
}

function triggerShutdownScreen() {
  const overlay = buildFullscreenOverlay('cmd-shutdown-overlay');
  overlay.style.background = '#000';
  overlay.style.color = '#fff';
  overlay.style.justifyContent = 'center';
  overlay.innerHTML = `<div style="font-size: 1.1rem;">Windows is shutting down...</div>`;

  setTimeout(() => {
    overlay.innerHTML = `<div style="font-size: 1.1rem;">It is now safe to turn off your computer.</div>`;
    const dismiss = () => location.reload();
    overlay.addEventListener('click', dismiss);
    document.addEventListener('keydown', dismiss, { once: true });
  }, 1800);
}

function simulateExplorerCrash() {
  const desktop = document.querySelector('.icons');
  const taskbar = document.querySelector('.start_bar');
  [desktop, taskbar].forEach((el) => el && (el.style.visibility = 'hidden'));
  setTimeout(() => {
    [desktop, taskbar].forEach((el) => el && (el.style.visibility = ''));
  }, 1500);
}

function applyDomEffect(effect) {
  if (!effect) return;
  if (effect.hide) {
    document.querySelector(effect.hide)?.style.setProperty('display', 'none');
  }
  if (effect.wallpaper) {
    const desktop = document.querySelector('.main_section');
    if (desktop) desktop.style.backgroundImage = 'none';
  }
}

// ---------- path helpers bound to the live cwd ----------

function resolvePath(input) {
  return fsResolvePath(cwd, input);
}
function getNode(parts) {
  return fsGetNode(root, parts);
}
function realParts(parts) {
  return fsRealParts(root, parts);
}
function formatPath(parts) {
  return fsFormatPath(parts);
}

// ---------- formatting helpers ----------

function pad(n) {
  return String(n).padStart(2, '0');
}
function formatDate(d) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}
function formatTime(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
}
function formatDirDate(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}  ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}
function formatSize(n) {
  return n.toLocaleString('en-US');
}

// ---------- navigation & file management ----------

function cmdDir(argStr) {
  const flags = extractFlags(argStr);
  const target = flags.rest;
  const { parts, error } = resolvePath(target);
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const node = getNode(parts);
  if (!node || node.type !== 'dir') {
    appendLine('The system cannot find the path specified.');
    return;
  }

  appendLine(' Volume in drive C has no label.');
  appendLine(' Volume Serial Number is 1337-C0DE');
  appendLine('');
  appendLine(` Directory of ${formatPath(parts)}`);
  appendLine('');

  const now = new Date();
  appendLine(`${formatDirDate(now)}    <DIR>          .`);
  appendLine(`${formatDirDate(now)}    <DIR>          ..`);

  const entries = [...node.children.values()]
    .filter((n) => flags.a || !n.attrs.hidden)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  let fileCount = 0;
  let dirCount = 0;
  let totalSize = 0;
  entries.forEach((n) => {
    if (n.type === 'dir') {
      dirCount++;
      appendLine(`${formatDirDate(now)}    <DIR>          ${n.name}`);
    } else {
      fileCount++;
      totalSize += n.size;
      appendLine(
        `${formatDirDate(now)}    ${formatSize(n.size).padStart(14)} ${n.name}`
      );
    }
  });
  appendLine(`               ${fileCount} File(s)  ${formatSize(totalSize)} bytes`);
  appendLine(`               ${dirCount + 2} Dir(s)  42,738,933,760 bytes free`);
}

function cmdCd(argStr) {
  const target = tokenize(argStr).join(' ');
  if (!target) {
    appendLine(formatPath(cwd));
    return;
  }
  const { parts, error } = resolvePath(target);
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const node = getNode(parts);
  if (!node) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  if (node.type !== 'dir') {
    appendLine('The directory name is invalid.');
    return;
  }
  cwd = realParts(parts);
}

function cmdMd(argStr) {
  const target = tokenize(argStr).join(' ');
  if (!target) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const { parts, error } = resolvePath(target);
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  let parent = root;
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i];
    let child = parent.children.get(seg);
    if (!child) {
      child = makeDir(seg);
      parent.children.set(seg, child);
    } else if (i === parts.length - 1) {
      appendLine('A subdirectory or file already exists.');
      return;
    } else if (child.type !== 'dir') {
      appendLine('A subdirectory or file already exists.');
      return;
    }
    parent = child;
  }
}

function cmdRd(argStr) {
  const flags = extractFlags(argStr);
  const target = flags.rest;
  if (!target) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const { parts, error } = resolvePath(target);
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  if (parts.length <= 1) {
    appendLine('Access is denied.');
    return;
  }
  const node = getNode(parts);
  if (!node) {
    appendLine('The system cannot find the file specified.');
    return;
  }
  if (node.type !== 'dir') {
    appendLine('The directory name is invalid.');
    return;
  }
  if (containsCritical(node)) {
    triggerBSOD('INACCESSIBLE_BOOT_DEVICE');
    return 'halt';
  }
  if (node.children.size > 0 && !flags.s) {
    appendLine('The directory is not empty.');
    return;
  }
  if (flags.s) collectDomEffects(node).forEach(applyDomEffect);

  const parentNode = getNode(parts.slice(0, -1));
  parentNode.children.delete(node.name);
  if (cwd.join('\\').startsWith(parts.join('\\'))) {
    cwd = realParts(parts.slice(0, -1));
  }
}

function cmdDel(argStr) {
  const flags = extractFlags(argStr);
  const target = flags.rest;
  if (!target) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const { parts, error } = resolvePath(target);
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const baseName = parts[parts.length - 1];
  const parent = getNode(parts.slice(0, -1));
  if (!parent || parent.type !== 'dir') {
    appendLine('The system cannot find the path specified.');
    return;
  }

  if (baseName === '*' || baseName === '*.*') {
    const victims = [...parent.children.values()].filter((n) => n.type === 'file');
    victims.forEach((n) => {
      if (n.protected) {
        appendLine(
          'The process cannot access the file because it is being used by another process.'
        );
        return;
      }
      if (n.domEffect) applyDomEffect(n.domEffect);
      parent.children.delete(n.name);
    });
    return;
  }

  const node = parent.children.get(baseName);
  if (!node) {
    appendLine(`Could not find ${formatPath(parts)}`);
    return;
  }
  if (node.type === 'dir') {
    appendLine('Access is denied.');
    return;
  }
  if (node.protected) {
    appendLine(
      'The process cannot access the file because it is being used by another process.'
    );
    return;
  }
  if (node.domEffect) applyDomEffect(node.domEffect);
  parent.children.delete(node.name);
}

function cmdRen(argStr) {
  const tokens = tokenize(argStr);
  const [src, dst] = tokens;
  if (!src || !dst) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const { parts, error } = resolvePath(src);
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const node = getNode(parts);
  if (!node) {
    appendLine('The system cannot find the file specified.');
    return;
  }
  if (node.protected) {
    appendLine('Access is denied.');
    return;
  }
  if (/[\\/]/.test(dst)) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const parent = getNode(parts.slice(0, -1));
  if (parent.children.has(dst)) {
    appendLine('A duplicate file name exists, or the file cannot be found.');
    return;
  }
  parent.children.delete(node.name);
  node.name = dst;
  parent.children.set(dst, node);
}

function resolveDest(dstRaw, fallbackName) {
  const { parts, error } = resolvePath(dstRaw);
  if (error) return { error };
  const existing = getNode(parts);
  if (existing && existing.type === 'dir') {
    return { destDir: existing, destName: fallbackName };
  }
  return { destDir: getNode(parts.slice(0, -1)), destName: parts[parts.length - 1] };
}

function cmdCopy(argStr) {
  const tokens = tokenize(argStr);
  const [src, dstRaw] = tokens;
  if (!src) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const { parts: srcParts, error: e1 } = resolvePath(src);
  if (e1) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const srcNode = getNode(srcParts);
  if (!srcNode) {
    appendLine('The system cannot find the file specified.');
    return;
  }
  if (srcNode.type === 'dir') {
    appendLine('Cannot copy a directory. Use XCOPY instead.');
    return;
  }

  let destDir, destName;
  if (!dstRaw) {
    destDir = getNode(cwd);
    destName = srcNode.name;
  } else {
    const r = resolveDest(dstRaw, srcNode.name);
    if (r.error) {
      appendLine('The system cannot find the path specified.');
      return;
    }
    ({ destDir, destName } = r);
  }
  if (!destDir || destDir.type !== 'dir') {
    appendLine('The system cannot find the path specified.');
    return;
  }

  const clone = deepClone(srcNode, false);
  clone.name = destName;
  destDir.children.set(destName, clone);
  appendLine('        1 file(s) copied.');
}

function cmdXcopy(argStr) {
  const flags = extractFlags(argStr);
  const [src, dstRaw] = flags.restTokens;
  if (!src || !dstRaw) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const { parts: srcParts, error: e1 } = resolvePath(src);
  if (e1) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const srcNode = getNode(srcParts);
  if (!srcNode) {
    appendLine(`File not found - ${src}`);
    return;
  }
  const r = resolveDest(dstRaw, srcNode.name);
  if (r.error || !r.destDir) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const clone = deepClone(srcNode, false);
  clone.name = r.destName;
  r.destDir.children.set(r.destName, clone);
  appendLine(`${countFiles(clone)} File(s) copied`);
}

function cmdMove(argStr) {
  const tokens = tokenize(argStr);
  const [src, dstRaw] = tokens;
  if (!src || !dstRaw) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const { parts: srcParts, error: e1 } = resolvePath(src);
  if (e1) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const node = getNode(srcParts);
  if (!node) {
    appendLine('The system cannot find the file specified.');
    return;
  }
  if (node.protected || node.critical) {
    appendLine('Access is denied.');
    return;
  }
  const r = resolveDest(dstRaw, node.name);
  if (r.error || !r.destDir || r.destDir.type !== 'dir') {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const srcParent = getNode(srcParts.slice(0, -1));
  srcParent.children.delete(node.name);
  node.name = r.destName;
  r.destDir.children.set(r.destName, node);
  appendLine('        1 file(s) moved.');
}

function cmdType(argStr) {
  const target = tokenize(argStr).join(' ');
  if (!target) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const { parts, error } = resolvePath(target);
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const node = getNode(parts);
  if (!node) {
    appendLine(`The system cannot find the file ${target}.`);
    return;
  }
  if (node.type === 'dir') {
    appendLine('Access is denied.');
    return;
  }
  if (!node.content) {
    appendLine('(This file has no viewable text content.)');
    return;
  }
  appendLines(node.content.replace(/\n+$/, ''));
}

function attrString(n) {
  let s = '';
  s += n.attrs.readOnly ? 'R' : ' ';
  s += n.attrs.hidden ? 'H' : ' ';
  s += n.attrs.system ? 'S' : ' ';
  return s.padEnd(8, ' ');
}

function cmdAttrib(argStr) {
  const tokens = tokenize(argStr);
  const flagTokens = tokens.filter((t) => /^[+-][rhsa]$/i.test(t));
  const pathTokens = tokens.filter((t) => !/^[+-][rhsa]$/i.test(t));
  const target = pathTokens.join(' ');

  if (!target) {
    const node = getNode(cwd);
    [...node.children.values()].forEach((n) => {
      appendLine(`${attrString(n)} ${formatPath([...cwd, n.name])}`);
    });
    return;
  }

  const { parts, error } = resolvePath(target);
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const node = getNode(parts);
  if (!node) {
    appendLine(`File not found - ${target}`);
    return;
  }
  if (flagTokens.length === 0) {
    appendLine(`${attrString(node)} ${formatPath(parts)}`);
    return;
  }
  flagTokens.forEach((f) => {
    const on = f[0] === '+';
    const letter = f[1].toLowerCase();
    if (letter === 'r') node.attrs.readOnly = on;
    if (letter === 'h') node.attrs.hidden = on;
    if (letter === 's') node.attrs.system = on;
  });
}

function buildTreeLines(node, prefix, lines) {
  const dirs = [...node.children.values()]
    .filter((n) => n.type === 'dir')
    .sort((a, b) => a.name.localeCompare(b.name));
  dirs.forEach((d, i) => {
    const last = i === dirs.length - 1;
    lines.push(`${prefix}${last ? '\\---' : '+---'}${d.name}`);
    buildTreeLines(d, `${prefix}${last ? '    ' : '|   '}`, lines);
  });
}

function cmdTree(argStr) {
  const target = tokenize(argStr).join(' ');
  const { parts, error } = target ? resolvePath(target) : { parts: cwd.slice() };
  if (error) {
    appendLine('The system cannot find the path specified.');
    return;
  }
  const node = getNode(parts);
  if (!node || node.type !== 'dir') {
    appendLine('The system cannot find the path specified.');
    return;
  }
  appendLine('Folder PATH listing');
  appendLine('Volume serial number is 1337-C0DE');
  appendLine(formatPath(parts));
  const lines = [];
  buildTreeLines(node, '', lines);
  if (lines.length === 0) appendLine('No subfolders exist');
  else lines.forEach(appendLine);
}

// ---------- system info & diagnostics ----------

function cmdSystemInfo() {
  const mins = Math.floor((Date.now() - pageLoadTime) / 60000);
  appendLines(
    `Host Name:                 CONNOR-PC
OS Name:                    ConnorDalley XP Professional
OS Version:                 v1.0.7260 Build 7260
OS Manufacturer:            Connor Dalley
System Manufacturer:        Custom Build
System Model:               Portfolio Edition
Processor(s):               1 Processor(s) Installed. Browser JS Engine
BIOS Version:               GitHub Pages BIOS, 07/2026
Windows Directory:          C:\\Windows
System Directory:           C:\\Windows\\System32
Boot Device:                \\Device\\HarddiskVolume1
Time Zone:                   Coordinated Universal Time
Total Physical Memory:      640 KB (ought to be enough for anybody)
System Up Time:             ${mins} Minute(s)`
  );
}

function cmdIpConfig(argStr) {
  if (!/\/all/i.test(argStr)) {
    appendLines(
      `
Windows IP Configuration

Ethernet adapter Local Area Connection:

   Connection-specific DNS Suffix  . :
   IP Address. . . . . . . . . . . . : 192.168.1.42
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1`
    );
    return;
  }
  appendLines(
    `
Windows IP Configuration

   Host Name . . . . . . . . . . . . : CONNOR-PC
   Primary Dns Suffix  . . . . . . . :
   Node Type . . . . . . . . . . . . : Hybrid

Ethernet adapter Local Area Connection:

   Description . . . . . . . . . . . : Portfolio Virtual Ethernet Adapter
   Physical Address. . . . . . . . . : 13-37-C0-DE-13-37
   DHCP Enabled. . . . . . . . . . . : Yes
   IP Address. . . . . . . . . . . . : 192.168.1.42
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   DNS Servers . . . . . . . . . . . : 8.8.8.8`
  );
}

function cmdPing(argStr) {
  const target = tokenize(argStr)[0];
  if (!target) {
    appendLine('Usage: ping <hostname>');
    return;
  }
  appendLine(`\nPinging ${target} with 32 bytes of data:`);
  const times = [12, 15, 11, 14].map((t) => t + Math.floor(Math.random() * 8));
  times.forEach((t) =>
    appendLine(`Reply from 192.168.1.1: bytes=32 time=${t}ms TTL=64`)
  );
  appendLine('');
  appendLine(`Ping statistics for ${target}:`);
  appendLine('    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),');
  appendLine('Approximate round trip times in milli-seconds:');
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  appendLine(
    `    Minimum = ${Math.min(...times)}ms, Maximum = ${Math.max(...times)}ms, Average = ${avg}ms`
  );
}

function cmdTracert(argStr) {
  const target = tokenize(argStr)[0];
  if (!target) {
    appendLine('Usage: tracert <hostname>');
    return;
  }
  appendLine(`\nTracing route to ${target} over a maximum of 30 hops:\n`);
  const hops = ['192.168.1.1', '10.10.0.1', '172.16.4.9', target];
  hops.forEach((hop, i) => {
    appendLine(
      `  ${i + 1}    ${5 + i * 6} ms    ${6 + i * 5} ms    ${7 + i * 4} ms  ${hop}`
    );
  });
  appendLine('\nTrace complete.');
}

function cmdNetstat() {
  appendLines(
    `
Active Connections

  Proto  Local Address          Foreign Address        State
  TCP    192.168.1.42:51322     104.18.32.7:443        ESTABLISHED
  TCP    192.168.1.42:51410     140.82.112.3:443       ESTABLISHED
  TCP    192.168.1.42:51555     185.199.108.153:443    TIME_WAIT`
  );
}

const appProcessNames = new Map([
  ['About Me', 'AboutMe.exe'],
  ['Resume', 'AcroRd32.exe'],
  ['Projects', 'iexplore.exe'],
  ['Contact Me', 'msimn.exe'],
  ['Media Player', 'wmplayer.exe'],
  ['Command Prompt', 'cmd.exe'],
]);

const systemProcesses = [
  { name: 'System Idle Process', pid: 0, mem: '0 K' },
  { name: 'System', pid: 4, mem: '212 K', critical: true },
  { name: 'smss.exe', pid: 384, mem: '380 K', critical: true },
  { name: 'csrss.exe', pid: 612, mem: '3,624 K', critical: true },
  { name: 'winlogon.exe', pid: 640, mem: '2,896 K', critical: true },
  { name: 'services.exe', pid: 684, mem: '3,204 K' },
  { name: 'lsass.exe', pid: 696, mem: '1,148 K' },
  { name: 'explorer.exe', pid: 1512, mem: '18,204 K', isShell: true },
];

let nextPid = 2000;
const appPids = new Map();
function pidFor(appName) {
  if (!appPids.has(appName)) appPids.set(appName, (nextPid += 4));
  return appPids.get(appName);
}

function cmdTasklist() {
  appendLine('Image Name                     PID Mem Usage');
  appendLine('========================= ======== ============');
  systemProcesses.forEach((p) => {
    appendLine(`${p.name.padEnd(26)} ${String(p.pid).padStart(8)}  ${p.mem}`);
  });
  appWindows.forEach((win, appName) => {
    if (!win.hasAttribute('open')) return;
    const exeName = appProcessNames.get(appName) || `${appName.replace(/\s+/g, '')}.exe`;
    const mem = `${(8000 + appName.length * 137).toLocaleString('en-US')} K`;
    appendLine(`${exeName.padEnd(26)} ${String(pidFor(appName)).padStart(8)}  ${mem}`);
  });
}

function cmdTaskkill(argStr) {
  const tokens = tokenize(argStr);
  let imArg = null;
  let pidArg = null;
  tokens.forEach((t, i) => {
    if (/^\/im$/i.test(t)) imArg = tokens[i + 1];
    if (/^\/pid$/i.test(t)) pidArg = tokens[i + 1];
  });
  if (!imArg && !pidArg) {
    appendLine('ERROR: Invalid syntax. Use /IM <name> or /PID <number>.');
    return;
  }

  const sysMatch = systemProcesses.find(
    (p) =>
      (imArg && p.name === imArg) ||
      (pidArg && String(p.pid) === pidArg)
  );
  if (sysMatch) {
    if (sysMatch.critical) {
      triggerBSOD('CRITICAL_PROCESS_DIED');
      return 'halt';
    }
    appendLine(
      `SUCCESS: The process "${sysMatch.name}" with PID ${sysMatch.pid} has been terminated.`
    );
    if (sysMatch.isShell) simulateExplorerCrash();
    return;
  }

  let matchedApp = null;
  appWindows.forEach((win, appName) => {
    if (!win.hasAttribute('open')) return;
    const exeName = appProcessNames.get(appName) || `${appName.replace(/\s+/g, '')}.exe`;
    if (
      (imArg && exeName === imArg) ||
      (pidArg && String(pidFor(appName)) === pidArg)
    ) {
      matchedApp = { appName, win, exeName };
    }
  });

  if (matchedApp) {
    appendLine(
      `SUCCESS: The process "${matchedApp.exeName}" with PID ${pidFor(matchedApp.appName)} has been terminated.`
    );
    matchedApp.win.close();
    return matchedApp.appName === 'Command Prompt' ? 'halt' : undefined;
  }

  appendLine(`ERROR: The process "${imArg || pidArg}" not found.`);
}

// ---------- disk utilities ----------

function cmdChkdsk() {
  appendLines(
    `The type of the file system is FAT32.
Volume Serial Number is 1337-C0DE

Windows is verifying files and folders...
File verification completed.
Windows has scanned the file system and found no problems.

  1,048,576 KB total disk space.
    512,300 KB in ${countFiles(root)} files.
     14,336 KB in ${countDirs(root)} directories.
    521,940 KB available on disk.`
  );
}

function cmdFormat() {
  appendLine('WARNING, ALL DATA ON NON-REMOVABLE DISK');
  appendLine('DRIVE C: WILL BE LOST!');
  appendLine('Proceed anyway? (Y/N) Y');
  appendLine('Formatting 40.0 GB');
  setTimeout(() => triggerBSOD('INACCESSIBLE_BOOT_DEVICE'), 900);
  return 'halt';
}

function runDiskpartCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  if (trimmed === 'exit') {
    mode = 'normal';
    appendLine('Leaving DiskPart...');
    return;
  }
  if (trimmed === 'list disk') {
    appendLines(
      `  Disk ###  Status         Size     Free     Dyn  Gpt
  --------  -------------  -------  -------  ---  ---
  Disk 0    Online           40 GB      0 B`
    );
    return;
  }
  if (/^select disk/.test(trimmed)) {
    appendLine('Disk 0 is now the selected disk.');
    return;
  }
  if (trimmed === 'detail disk') {
    appendLines('ConnorDalley Virtual Disk\nDisk ID: C0FFEE00\nType   : Virtual');
    return;
  }
  if (trimmed === 'clean') {
    appendLine('DiskPart succeeded in cleaning the disk.');
    setTimeout(() => triggerBSOD('INACCESSIBLE_BOOT_DEVICE'), 700);
    return 'halt';
  }
  appendLine(
    'DiskPart does not recognize the command you entered. Type "exit" to return to the command prompt.'
  );
}

// ---------- utility & misc ----------

function cmdSet(argStr) {
  const trimmed = argStr.trim();
  if (!trimmed) {
    Object.entries(env)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([k, v]) => appendLine(`${k}=${v}`));
    return;
  }
  const eq = trimmed.indexOf('=');
  if (eq === -1) {
    const key = Object.keys(env).find((k) => k === trimmed);
    if (key) appendLine(`${key}=${env[key]}`);
    else appendLine(`Environment variable ${trimmed} not defined`);
    return;
  }
  const key = trimmed.slice(0, eq);
  const val = trimmed.slice(eq + 1);
  if (val === '') delete env[key];
  else env[key] = val;
}

function cmdPath(argStr) {
  const trimmed = argStr.trim();
  if (!trimmed) {
    appendLine(`PATH=${env.PATH}`);
    return;
  }
  env.PATH = trimmed.replace(/^=/, '');
}

function cmdTitle(argStr) {
  cmdWindow.setAttribute('title', argStr.trim() || 'Command Prompt');
}

function cmdColor(argStr) {
  const code = argStr.trim();
  if (!code) {
    screen.style.background = '';
    screen.style.color = '';
    return;
  }
  const m = /^([0-9A-Fa-f])([0-9A-Fa-f])$/.exec(code);
  if (!m) {
    appendLine(
      'The color command only accepts hexadecimal digit values 0-9, A-F for background and foreground.'
    );
    return;
  }
  screen.style.background = COLORS[m[1].toUpperCase()];
  screen.style.color = COLORS[m[2].toUpperCase()];
}

function cmdEcho(argStr) {
  const trimmed = argStr.trim();
  if (trimmed === 'off') {
    echoOn = false;
    return;
  }
  if (trimmed === 'on') {
    echoOn = true;
    return;
  }
  if (!trimmed) {
    appendLine(`ECHO is ${echoOn ? 'on' : 'off'}.`);
    return;
  }
  appendLine(trimmed);
}

function cmdPause() {
  appendLine('Press any key to continue . . . ');
  setTimeout(() => {
    const resume = () => {
      document.removeEventListener('keydown', resume);
      appendLine('');
      newPromptLine();
    };
    document.addEventListener('keydown', resume);
  }, 0);
  return 'halt';
}

function cmdShutdown() {
  appendLine(
    'This system is shutting down. Please save all work in progress and log off.'
  );
  setTimeout(triggerShutdownScreen, 900);
  return 'halt';
}

function cmdIf(argStr) {
  const trimmed = argStr.trim();
  let m = /^(not\s+)?exist\s+(\S+)\s+(.+)$/.exec(trimmed);
  if (m) {
    const negate = !!m[1];
    const { parts, error } = resolvePath(m[2]);
    const exists = !error && !!getNode(parts);
    if (exists !== negate) return runCommand(m[3]);
    return;
  }
  m =
    /^(not\s+)?"([^"]*)"\s*==\s*"([^"]*)"\s+(.+)$/.exec(trimmed) ||
    /^(not\s+)?(\S+)\s*==\s*(\S+)\s+(.+)$/.exec(trimmed);
  if (m) {
    const negate = !!m[1];
    const equal = m[2] === m[3];
    if (equal !== negate) return runCommand(m[4]);
    return;
  }
  appendLine('The syntax of the command is incorrect.');
}

function cmdFor(argStr) {
  const m = /^%%?(\w)\s+in\s+\(([^)]*)\)\s+do\s+(.+)$/.exec(argStr.trim());
  if (!m) {
    appendLine('The syntax of the command is incorrect.');
    return;
  }
  const [, varName, itemsRaw, doCmd] = m;
  const items = itemsRaw.split(/\s+/).filter(Boolean);
  let result;
  items.forEach((item) => {
    const substituted = doCmd.replace(new RegExp(`%%?${varName}\\b`, 'g'), item);
    result = runCommand(substituted);
  });
  return result;
}

function cmdGoto(argStr) {
  if (!argStr.trim()) {
    appendLine('The syntax of the command is incorrect.');
  }
  // Labels only mean something inside a batch file; interactively this is a no-op.
}

function cmdCall(argStr) {
  const trimmed = argStr.trim();
  if (!trimmed) return;
  return runCommand(trimmed);
}

// ---------- command table ----------

const commands = {
  help() {
    appendLines(
      `Navigation & File Management:
  dir, cd, md, rd, copy, xcopy, move, del, ren, type, attrib, tree

System Info & Diagnostics:
  ver, systeminfo, ipconfig, ping, tracert, netstat, tasklist, taskkill

Disk Utilities:
  chkdsk, format, diskpart

Utility:
  cls, echo, exit, help, pause, set, path, title, color, date, time, shutdown

Batch Scripting:
  if, for, goto, call

Info: author, stack, disclaimer

Commands are case-sensitive - type them exactly as shown above.`
    );
  },
  ver() {
    appendLine(VERSION_LINE);
  },
  date() {
    appendLine(`The current date is: ${formatDate(new Date())}`);
  },
  time() {
    appendLine(`The current time is: ${formatTime(new Date())}`);
  },
  author() {
    appendLines(
      'Connor Dalley\nSoftware Engineer | B.S. Computer Science, University of Utah\n\nGitHub: github.com/dconnorj\nLinkedIn: linkedin.com/in/cjdalley-swe'
    );
  },
  stack() {
    appendLines('HTML\nCSS\nJavaScript\n\nBuilt from scratch, hosted on GitHub Pages');
  },
  disclaimer() {
    appendLines(
      'This site is a personal portfolio project. All logos, artwork,\n' +
        'and assets referenced remain the property of their respective\n' +
        'owners. They are included here as inspiration, homage, or parody,\n' +
        'not as original creations or with any claim of ownership. This\n' +
        'project is independent and has no affiliation with or endorsement\n' +
        'from Microsoft or the Windows XP brand.'
    );
  },
  dir: cmdDir,
  cd: cmdCd,
  chdir: cmdCd,
  md: cmdMd,
  mkdir: cmdMd,
  rd: cmdRd,
  rmdir: cmdRd,
  copy: cmdCopy,
  xcopy: cmdXcopy,
  move: cmdMove,
  del: cmdDel,
  erase: cmdDel,
  ren: cmdRen,
  rename: cmdRen,
  type: cmdType,
  attrib: cmdAttrib,
  tree: cmdTree,
  systeminfo: cmdSystemInfo,
  ipconfig: cmdIpConfig,
  ping: cmdPing,
  tracert: cmdTracert,
  netstat: cmdNetstat,
  tasklist: cmdTasklist,
  taskkill: cmdTaskkill,
  chkdsk: cmdChkdsk,
  format: cmdFormat,
  diskpart() {
    appendLines('Microsoft DiskPart version 5.1.3565\n\nOn computer: CONNOR-PC\n');
    mode = 'diskpart';
  },
  set: cmdSet,
  path: cmdPath,
  title: cmdTitle,
  color: cmdColor,
  echo: cmdEcho,
  pause: cmdPause,
  shutdown: cmdShutdown,
  if: cmdIf,
  for: cmdFor,
  goto: cmdGoto,
  call: cmdCall,
  exit() {
    cmdWindow.close();
    return 'halt';
  },
};

function runCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  const spaceIdx = trimmed.indexOf(' ');
  const cmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1);
  const handler = commands[cmd];
  if (!handler) {
    appendLine(`'${cmd}' is not recognized as an internal or external command,`);
    appendLine('operable program or batch file.');
    return;
  }
  return handler(rest);
}

// ---------- boot / reset ----------

function resetTerminal() {
  cwd = ['C:', 'Users', 'Connor'];
  mode = 'normal';
  echoOn = true;
  env = defaultEnv();
  screen.style.background = '';
  screen.style.color = '';
  cmdWindow.setAttribute('title', 'Command Prompt');
  linesContainer.innerHTML = '';
  appendLines(
    `${VERSION_LINE}\n` +
      'Inspired by Windows XP\n\n' +
      "Type 'help' for a list of commands.\n" +
      'Press ENTER/RETURN to execute commands.\n'
  );
  newPromptLine();
}

if (cmdWindow && screen && linesContainer) {
  resetTerminal();

  screen.addEventListener('click', () => inputEl?.focus());
  cmdWindow.addEventListener('window-opened', () => inputEl?.focus());
  cmdWindow.addEventListener('window-closed', () => resetTerminal());
}
