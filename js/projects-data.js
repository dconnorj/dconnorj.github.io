// Each entry powers a project card in the tab lists, the inner-nav dropdown
// links, and the individual project detail page. `tags` controls which nav
// tab(s) list a project under (and which tab gets highlighted when viewing
// its detail page): 'full-stack' | 'web' | 'mobile' | 'back-end'. `video`
// is optional: set it to { src, poster } (a local file under Res/) to show
// a walkthrough clip on the detail page.
//
// `repoStatus` is 'public' (shows a "View on GitHub" button linking to
// `github`) or 'private' (shows a note instead — no `github` link needed).
// Use 'private' for school projects you can't/won't put in a public repo.
export const projects = [
  {
    slug: 'portfolio-site',
    title: 'Connor Dalley XP',
    tags: ['web'],
    summary:
      'This portfolio site itself — a Windows XP-styled desktop recreated in vanilla HTML, CSS, and JavaScript, right down to draggable windows and a working taskbar.',
    description:
      "This is the site you're browsing right now: a nostalgic recreation of the Windows XP desktop, built as a personal portfolio. Every window — including this Projects app — is a custom, draggable, resizable UI component built from scratch with vanilla HTML, CSS, and JavaScript, with no frameworks or build step. It handles a taskbar with running-app tracking, a Start menu, window focus/z-index management, minimize/maximize/restore transitions, and this project browser with its own back/forward history stack and tabbed navigation. The goal was to combine genuine software engineering (state management, component architecture, event handling) with a fun, detail-oriented UI project that stands out from a typical portfolio template.",
    techStack: ['HTML', 'CSS', 'JavaScript'],
    repoStatus: 'public',
    github: 'https://github.com/dconnorj/dconnorj.github.io',
    image: 'Res/Portfolio_Icon.png',
    video: null,
  },
  {
    slug: 'agora',
    title: 'Agora',
    tags: ['full-stack', 'web', 'mobile', 'back-end'],
    summary:
      'Agora is a capstone web and mobile app that turns government legislative data into personalized feeds and politician accountability profiles to help voters stay informed and combat misinformation.',
    description:
      "Agora addresses the problem that current government websites and legislative-tracking tools are difficult to navigate and require users to already know what they're looking for, leaving voters uninformed and disengaged from the legislative process. The application solves this by pulling data from government APIs and using it to build personalized news feeds, detailed politician profiles (including voting records, funding sources, and policy stances), and a scoring system that shows how well a representative's votes align with a user's stated interests. The system architecture consists of a Python-based data fetcher that pulls and categorizes legislative data, a Flask/MySQL backend that serves this data securely over HTTPS to two client applications, a Next.js website emphasizing fast, cached, responsive interactions, and a Flutter mobile app using SQLite for local persistence of followed bills. Developed by a four-person team (Connor Dalley, Andrew Hart, James Hart, and Samuel Powell) using Agile methodology, GitLab, and structured code reviews, the project distinguishes itself from paid enterprise tools like BillTrack50 by targeting individual voters directly and emphasizing unbiased, primary-source legislative information as a check against political misinformation.",
    techStack: [
      'Python',
      'Flask',
      'SQLAlchemy',
      'MySQL',
      'Nginx',
      'Next.js',
      'React',
      'JavaScript',
      'Chart.js',
      'Flutter',
      'Dart',
      'SQLite',
      'Firebase',
      'HTTPS',
      'GitLab',
    ],
    repoStatus: 'private',
    github: null,
    image: 'Res/project-page/Agora Circle Logo_Maybe_(1).png',
    video: { youtube: 'RhkooYn_i0M' },
  },
  {
    slug: 'word-ninja',
    title: 'Word Ninja',
    tags: ['mobile'],
    summary:
      'Word Ninja is a Wordle-style word-guessing game built in Swift, using a local SQLite database to serve random words and ensure players never see a repeat.',
    description:
      "Word Ninja is a native iOS word-guessing game inspired by Wordle, built entirely in Swift. The core challenge was word management: rather than hardcoding a word list or hitting an API, I built a local SQLite database to store the word bank and handle random selection on-device. The app tracks which words a given user has already played and filters them out of future selections, so no word repeats across sessions. This required designing a lightweight schema for words and play history, writing queries to pull a random unseen word efficiently as the played list grows, and wiring that logic into the game's state management so a new puzzle loads instantly each time the user starts a round. The result is a fast, fully offline guessing game with persistent, non-repeating gameplay.",
    techStack: ['Swift', 'SwiftUI', 'SQLite'],
    repoStatus: 'public',
    github: 'https://github.com/dconnorj/WordNinja',
    image: 'Res/project-page/samuri800x800(1).png',
    video: null,
  },
  {
    slug: 'dishbook',
    title: 'Dishbook',
    tags: ['full-stack', 'web', 'back-end'],
    summary:
      'Dishbook is a full-stack recipe app built with Django and Python, letting users create, organize, and share recipes, deployed live on AWS.',
    description:
      'Dishbook is a full-stack web application for discovering, creating, and organizing recipes. Built with Django on the backend, the app handles user accounts, recipe creation and editing, and data persistence through a relational database, while the frontend provides a clean interface for browsing and managing recipes. I built the project end-to-end — from data modeling and backend logic to frontend templates and styling — and deployed it live on AWS, handling server configuration, static/media file serving, and production settings. The project was a deep dive into the full Django request/response cycle, from ORM-backed models to production deployment on real infrastructure.',
    techStack: ['Python', 'Django', 'PostgreSQL', 'HTML', 'CSS', 'JavaScript', 'AWS'],
    repoStatus: 'private',
    github: null,
    image: 'Res/project-page/Screenshot 2026-07-03 at 5.28.47 PM.png',
    video: null,
  },
  {
    slug: 'drawing-app',
    title: 'Drawing App',
    tags: ['mobile'],
    summary:
      'A collaborative Android drawing app built with Kotlin and Jetpack Compose, featuring Firebase-backed cloud storage and native C++ image processing filters.',
    description:
      'Drawing App is a native Android application that lets users create, save, and share digital drawings, built collaboratively using Kotlin with Jetpack Compose and the Android ViewModel architecture. The app supports full user authentication and account management through Firebase Auth, with drawings and thumbnails uploaded to Firebase Storage and metadata tracked in Firestore. Users can save images locally, publicly, or to a private cloud collection, with the app dynamically pulling filenames and thumbnails per data source and caching thumbnails for performance. Beyond the Kotlin app layer, I worked on native C++ image processing code via the JNI/NDK bridge, implementing pixel-level bitmap manipulation functions including color inversion, horizontal and vertical flipping, and image offsetting by directly manipulating ARGB pixel buffers for performance. The project combined Kotlin/Compose UI and state management with low-level native image processing and cloud backend integration.',
    techStack: [
      'Kotlin',
      'Jetpack Compose',
      'C++',
      'JNI/NDK',
      'Firebase Auth',
      'Firebase Firestore',
      'Firebase Storage',
      'Android',
    ],
    repoStatus: 'private',
    github: null,
    image: 'Res/project-page/99Brushes.png',
    video: { src: 'Res/project-page/Phase3_video.mp4' },
  },
  {
    slug: 'spooky-simon',
    title: 'Spooky Simon',
    tags: ['full-stack'],
    summary:
      'A Halloween-themed Simon Says memory game built in C++ with Qt, featuring signal/slot game logic, background music, and custom animated feedback for wrong moves.',
    description:
      "Spooky Simon is a Halloween-reimagined take on the classic Simon Says memory game, built in C++ using the Qt framework. Players watch a sequence of red and blue button flashes and must repeat it back correctly, with the sequence growing longer each round and a progress bar tracking completion. The game architecture is built around Qt's signal/slot system, decoupling the GameLogic class from the MainWindow UI so that game state changes (starting a round, updating the progress bar, disabling buttons, showing game over) cleanly drive UI updates. To fit the Halloween theme, we added a custom background image, spooky background music using Qt Multimedia, and an animated GIF that plays when the player makes a mistake — a clip from The Shining for a missed red move, and a clip from Disney's The Legend of Sleepy Hollow for a missed blue move. Built collaboratively with Anh Trinh as a course project for CS3505.",
    techStack: ['C++', 'Qt', 'Qt Multimedia', 'Qt Widgets'],
    repoStatus: 'private',
    github: null,
    image: 'Res/project-page/Screenshot 2026-07-03 at 5.44.34 PM.png',
    video: { src: 'Res/project-page/A6 demo.mp4' },
  },
];
