// A tiny in-memory virtual file system for the Command Prompt easter egg.
// Deleting a node with a `domEffect` hides the matching real element on the
// page for the rest of the session; nodes marked `critical` are what the
// "unreasonable" destructive commands (FORMAT, RD /S on Windows\System32...)
// key off of to trigger the simulated blue screen.

let idCounter = 0;

export function makeDir(name, opts = {}) {
  return {
    id: `n${++idCounter}`,
    type: 'dir',
    name,
    children: new Map(),
    critical: !!opts.critical,
    protected: !!opts.protected,
    attrs: { readOnly: false, hidden: false, system: !!opts.critical },
  };
}

export function makeFile(name, opts = {}) {
  return {
    id: `n${++idCounter}`,
    type: 'file',
    name,
    content: opts.content ?? '',
    size: opts.size ?? 1024,
    critical: !!opts.critical,
    protected: !!opts.protected,
    domEffect: opts.domEffect || null,
    attrs: {
      readOnly: !!opts.readOnly,
      hidden: !!opts.hidden,
      system: !!opts.critical,
    },
  };
}

function add(parent, node) {
  parent.children.set(node.name, node);
  return node;
}

export function createFileSystem() {
  const root = makeDir('C:');

  const users = add(root, makeDir('Users'));
  const connor = add(users, makeDir('Connor'));

  const desktop = add(connor, makeDir('Desktop'));
  add(
    desktop,
    makeFile('About Me.lnk', { size: 1024, domEffect: { hide: '.about_me' } })
  );
  add(
    desktop,
    makeFile('Resume.pdf', { size: 1024, domEffect: { hide: '.my_resume' } })
  );
  add(
    desktop,
    makeFile('Projects.lnk', { size: 1024, domEffect: { hide: '.projects' } })
  );
  add(
    desktop,
    makeFile('Contact Me.lnk', {
      size: 1024,
      domEffect: { hide: '.contact_me' },
    })
  );

  const documents = add(connor, makeDir('Documents'));
  add(
    documents,
    makeFile('readme.txt', {
      size: 812,
      content:
        "This is Connor Dalley's portfolio site, built from scratch with\n" +
        'HTML, CSS, and vanilla JavaScript as an homage to Windows XP.\n\n' +
        "Try 'help' to see available commands, or 'dir' to look around.\n",
    })
  );

  const windowsDir = add(root, makeDir('Windows', { critical: true }));
  const system32 = add(windowsDir, makeDir('System32', { critical: true }));
  add(
    system32,
    makeFile('cmd.exe', { size: 388096, protected: true })
  );

  const web = add(windowsDir, makeDir('Web'));
  const wallpaper = add(web, makeDir('Wallpaper'));
  add(
    wallpaper,
    makeFile('Bliss.jpg', { size: 1395209, domEffect: { wallpaper: true } })
  );

  const programFiles = add(root, makeDir('Program Files'));
  const portfolio = add(programFiles, makeDir('ConnorDalleyPortfolio'));
  add(
    portfolio,
    makeFile('version.txt', {
      size: 64,
      content: 'ConnorDalley XP v1.0 (Jul 2026)\n',
    })
  );

  return root;
}

export function splitSegments(p) {
  return p.split(/[\\/]+/).filter(Boolean);
}

export function resolvePath(cwd, input) {
  if (!input) return { parts: cwd.slice() };
  const driveMatch = /^([a-zA-Z]):(.*)$/.exec(input);
  let parts;
  if (driveMatch) {
    const drive = `${driveMatch[1].toUpperCase()}:`;
    if (drive !== cwd[0]) return { error: 'nodrive' };
    parts = [drive, ...splitSegments(driveMatch[2])];
  } else if (/^[\\/]/.test(input)) {
    parts = [cwd[0], ...splitSegments(input)];
  } else {
    parts = cwd.slice();
    splitSegments(input).forEach((seg) => {
      if (seg === '.') return;
      if (seg === '..') {
        if (parts.length > 1) parts.pop();
      } else {
        parts.push(seg);
      }
    });
  }
  return { parts };
}

export function getNode(root, parts) {
  let node = root;
  for (let i = 1; i < parts.length; i++) {
    if (!node || node.type !== 'dir') return null;
    node = node.children.get(parts[i]);
    if (!node) return null;
  }
  return node;
}

export function realParts(root, parts) {
  const out = [root.name];
  let node = root;
  for (let i = 1; i < parts.length; i++) {
    const child = node?.children.get(parts[i]);
    out.push(child ? child.name : parts[i]);
    node = child;
  }
  return out;
}

export function formatPath(parts) {
  if (parts.length === 1) return `${parts[0]}\\`;
  return parts.join('\\');
}

export function containsCritical(node) {
  if (node.critical) return true;
  if (node.type === 'dir') {
    for (const child of node.children.values()) {
      if (containsCritical(child)) return true;
    }
  }
  return false;
}

export function collectDomEffects(node, acc = []) {
  if (node.type === 'file' && node.domEffect) acc.push(node.domEffect);
  if (node.type === 'dir') node.children.forEach((c) => collectDomEffects(c, acc));
  return acc;
}

export function countFiles(node) {
  if (node.type === 'file') return 1;
  let n = 0;
  node.children.forEach((c) => (n += countFiles(c)));
  return n;
}

export function countDirs(node) {
  if (node.type !== 'dir') return 0;
  let n = 0;
  node.children.forEach((c) => {
    if (c.type === 'dir') {
      n += 1;
      n += countDirs(c);
    }
  });
  return n;
}

export function deepClone(node, keepEffect) {
  if (node.type === 'file') {
    return { ...node, id: `n${++idCounter}`, domEffect: keepEffect ? node.domEffect : null };
  }
  const clone = makeDir(node.name);
  node.children.forEach((child, key) => clone.children.set(key, deepClone(child, keepEffect)));
  return clone;
}

export function tokenize(str) {
  const tokens = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(str))) {
    tokens.push(m[1] !== undefined ? m[1] : m[2]);
  }
  return tokens;
}

export function extractFlags(argStr) {
  const tokens = tokenize(argStr);
  const flags = {};
  const restTokens = [];
  tokens.forEach((t) => {
    const m = /^\/([a-zA-Z]+)$/.exec(t);
    if (m) {
      [...m[1].toLowerCase()].forEach((ch) => {
        flags[ch] = true;
      });
    } else {
      restTokens.push(t);
    }
  });
  flags.restTokens = restTokens;
  flags.rest = restTokens.join(' ');
  return flags;
}
