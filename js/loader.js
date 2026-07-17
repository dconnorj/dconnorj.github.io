const windowFiles = [
  { id: 'aboutMeWindow', file: 'windows/about-me.html' },
  { id: 'resumeWindow', file: 'windows/resume.html' },
  { id: 'projectsWindow', file: 'windows/projects.html' },
  { id: 'contactMeWindow', file: 'windows/contact-me.html' },
  { id: 'mediaPlayerWindow', file: 'windows/media-player.html' },
  { id: 'commandPromptWindow', file: 'windows/command-prompt.html' },
  { id: 'imageViewerWindow', file: 'windows/image-viewer.html' },
  { id: 'paintWindow', file: 'windows/paint.html' },
  { id: 'notepadWindow', file: 'windows/notepad.html' },
  { id: 'minesweeperWindow', file: 'windows/minesweeper.html' },
  { id: 'solitaireWindow', file: 'windows/solitaire.html' },
  { id: 'confirmWindow', file: 'windows/confirm.html' },
];

export async function loadWindows() {
  await Promise.all(
    windowFiles.map(async ({ id, file }) => {
      const win = document.getElementById(id);
      if (!win) return;
      try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Failed to load ${file}`);
        win.innerHTML = await res.text();
      } catch (err) {
        console.error(err);
      }
    })
  );
}
