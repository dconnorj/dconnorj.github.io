const windowFiles = [
  { id: 'aboutMeWindow', file: 'windows/about-me.html' },
  { id: 'resumeWindow', file: 'windows/resume.html' },
  { id: 'projectsWindow', file: 'windows/projects.html' },
  { id: 'contactInfoWindow', file: 'windows/contact-info.html' },
];

export async function loadWindows() {
  await Promise.all(
    windowFiles.map(async ({ id, file }) => {
      const win = document.getElementById(id);
      if (!win) return;
      try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Failed to load ${file}`);
        const html = await res.text();
        const container = document.createElement('div');
        container.innerHTML = html;
        win.appendChild(container);
      } catch (err) {
        console.error(err);
      }
    })
  );
}
