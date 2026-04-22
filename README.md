# ytdl-gui

> A premium desktop GUI for [yt-dlp](https://github.com/yt-dlp/yt-dlp) — download videos and audio from 1000+ sites.

Built with **Electron + React + Tailwind CSS**.

---

## Features

- 🎬 **Full yt-dlp control** — formats, codecs, resolution up to 8K, HDR, SponsorBlock, subtitles, chapters
- 📥 **Real-time download queue** — live progress bars, speed (MB/s), ETA
- 🔄 **Auto-update binary** — checks GitHub API and downloads the correct yt-dlp binary for your OS
- 🖥️ **Live Console** — expandable raw terminal output for advanced users
- 🌐 **Network & Auth** — proxy, cookies, rate limiting, concurrent fragments
- 📦 **Portable builds** — Windows `.exe`, Linux `AppImage`, macOS `.dmg`

---

## Development

```bash
npm install
npm run dev
```

> On first run, the app will auto-detect or prompt you to download the yt-dlp binary.

## Build (Production)

```bash
# All platforms
npm run dist

# Windows portable only
npm run dist:win

# Linux AppImage only
npm run dist:linux

# macOS DMG
npm run dist:mac
```

Outputs go to the `out/` directory.

---

## Project Structure

```
ytdl-gui/
├── electron/
│   ├── main.js          # Main process: window, IPC, binary, child_process
│   └── preload.js       # Context bridge (secure IPC)
├── src/
│   ├── context/
│   │   └── AppContext.jsx  # Global state (reducer + IPC listeners)
│   ├── components/
│   │   ├── TitleBar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── BinaryBanner.jsx
│   │   ├── Console.jsx
│   │   ├── Section.jsx
│   │   └── FormParts.jsx
│   ├── pages/
│   │   ├── DownloaderPage.jsx
│   │   ├── QueuePage.jsx
│   │   └── SettingsPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── binaries/            # yt-dlp binary placed here (auto-downloaded)
├── assets/              # App icons
├── vite.config.js
├── tailwind.config.js
└── package.json
```
