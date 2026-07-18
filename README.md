# Connor Dalley XP

A personal portfolio site built as a fully interactive recreation of the Windows XP desktop — draggable/resizable windows, a working taskbar and Start menu, a fake "Projects.net" browser with its own back/forward history, a Command Prompt with a real (if tiny) virtual file system, and a handful of playable mini-apps, all running in the browser with no UI framework and no build step.

Live site: https://connordalley.codes

## Purpose

Most developer portfolios are a static page of links and a project list. This one exists to do two things at once:

1. **Be memorable.** A nostalgic, detail-obsessed XP desktop is a lot more fun to explore than a resume-shaped webpage, and it gives a reviewer a reason to actually click around instead of skimming for thirty seconds.
2. **Demonstrate real front-end engineering.** Underneath the nostalgia, every window is a hand-built UI component: window focus/z-index management, minimize/maximize/restore transitions, drag/resize handling, a taskbar that tracks running apps, an in-memory virtual file system for the Command Prompt easter egg, and a project browser with its own tabbed navigation and history stack — all in hand-written HTML/CSS/JavaScript (ES modules), no React/Vue/build tooling required.

## A note on how this was built

Large parts of this project — UI polish, animation timing, the Command Prompt's command set, copy for the Projects app, and more — were built using AI-assisted ("vibe coding") workflows with Claude Code rather than written by hand line-by-line. Architecture, structure, and final review were driven by me, but I want to be transparent about the process rather than imply every line was hand-typed from scratch.

## Disclaimer

This site is a personal portfolio project. All logos, artwork, trademarks, and assets referenced or visually imitated (including the Windows XP look and feel, and Star Trek branding referenced below) remain the property of their respective owners. They are included here as inspiration, homage, or parody, not as original creations or with any claim of ownership. This project is independent and has no affiliation with or endorsement from Microsoft, the Windows XP brand, CBS/Paramount, or Star Trek.

## Works cited / inspiration

- **[mitchiven.com](https://mitchiven.com)** — a huge amount of stylistic inspiration for how to make a portfolio feel like a real, lived-in piece of software rather than a template came from Mitch Iven's site. Layout instincts, the idea of theming a whole portfolio around a nostalgic OS/desktop metaphor, and general "make it feel real" polish were pulled from here.
- **[startrek.com, circa 2000](https://web.archive.org/web/2000/http://www.startrek.com/)** (via the Wayback Machine) — the in-universe "Projects.net" website rendered inside the Projects app (complete with a sidebar ad banner, a "Klingon Language Lesson of the Day," and a trivia widget) is a direct homage to the look and feel of late-90s/early-2000s fan and franchise sites like StarTrek.com. The retro "slow connection" page-load animation (flashing background, staggered image pop-in, crawling progress bar in the address field) is also modeled on what browsing the web actually felt like back then.

### Third-party apps embedded in the desktop

A few of the desktop's "programs" are real, existing open-source/public web apps embedded via iframe (or, for Spider Solitaire, vendored locally) rather than built from scratch, since reimplementing full games/editors wasn't the point of this project:

- **Minesweeper** — [ziebelje.github.io/minesweeper](https://ziebelje.github.io/minesweeper/)
- **Notepad** — [98.js.org](https://98.js.org/programs/notepad/)
- **Paint** — [jspaint.app](https://jspaint.app/)
- **Spider Solitaire** — a CC0-licensed "WinXP Spider Solitaire" React build, vendored locally under `Res/spider-solitaire/`

All other windows (About Me, Resume, Projects, Contact Me, Media Player, Command Prompt, Image Viewer, and the desktop/taskbar/Start menu shell itself) are original code.

### Music

The tracks playable in the Media Player app (`Res/music/`) are sourced from **[Classicals.de](https://www.classicals.de)**:

- Mozart — *Così fan tutte*, "Come Scoglio" (MIT Symphony Orchestra) — CC BY-NC 4.0
- Tchaikovsky — *Swan Lake*, Op. 20, Act 2 Part 1 (The European Archive) — CC BY-NC 4.0
- Grieg — *Peer Gynt* Suite No. 1, Op. 46, "Morning" (The Musopen Kickstarter Project) — CC PDM 1.0 (public domain)
- Dvořák — Serenade for Strings, Op. 22, Larghetto (Advent Chamber Orchestra) — via Classicals.de

Per-track licensing details are included alongside each file in `Res/music/`.

### Other data sources used

- **[Open Trivia Database](https://opentdb.com/)** — powers the daily trivia question on the Projects home page.
- **[klingon.wiki](https://klingon.wiki/)** — the "Klingon word of the day" links out to definitions here.

## Tech stack

HTML, CSS, and JavaScript (ES modules) — built from scratch with no framework and no build step, hosted on GitHub Pages.

## Notes for reviewers

- `js/projects-data.js` is the single source of truth for the project cards/detail pages shown in the Projects app.
- `js/command-prompt-fs.js` + `js/command-prompt.js` implement a small in-memory virtual file system, including a simulated "blue screen" if you delete something critical enough — try `help` inside the Command Prompt app for the full command list, or `disclaimer` for the in-app version of the disclaimer above.
- Several code comments throughout the JS explain non-obvious browser quirks that were worked around (e.g. iframe reload behavior, CSS Grid sizing issues in the vendored Solitaire build) — worth a skim if you want to see the debugging behind the polish.
