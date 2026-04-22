const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';

// ─── ffmpeg Resolution ────────────────────────────────────────────────────────
function getFfmpegPath() {
  if (isDev) {
    // In dev: use ffmpeg-static from node_modules
    try {
      return require('ffmpeg-static');
    } catch {
      return null;
    }
  }
  // In production: ffmpeg is copied to resources/ffmpeg/
  const ext = process.platform === 'win32' ? '.exe' : '';
  const p = path.join(process.resourcesPath, 'ffmpeg', `ffmpeg${ext}`);
  return fs.existsSync(p) ? p : null;
}

// ─── Active Download Processes ────────────────────────────────────────────────
const activeProcesses = new Map(); // id → ChildProcess

// ─── Binary Management ────────────────────────────────────────────────────────
function getBinaryDir() {
  return isDev
    ? path.join(__dirname, '..', 'binaries')
    : path.join(process.resourcesPath, 'binaries');
}

function getBinaryPath() {
  const dir = getBinaryDir();
  const name = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  return path.join(dir, name);
}

function getBinaryDownloadUrl(version) {
  const platform = process.platform;
  if (platform === 'win32') {
    return `https://github.com/yt-dlp/yt-dlp/releases/download/${version}/yt-dlp.exe`;
  } else if (platform === 'darwin') {
    return `https://github.com/yt-dlp/yt-dlp/releases/download/${version}/yt-dlp_macos`;
  } else {
    return `https://github.com/yt-dlp/yt-dlp/releases/download/${version}/yt-dlp`;
  }
}

function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

        const total = parseInt(res.headers['content-length'] || '0', 10);
        let received = 0;
        const file = fs.createWriteStream(dest);

        res.on('data', (chunk) => {
          received += chunk.length;
          file.write(chunk);
          if (total > 0 && onProgress) onProgress(Math.round((received / total) * 100));
        });
        res.on('end', () => { file.end(); resolve(); });
        res.on('error', reject);
        file.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

async function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path: '/repos/yt-dlp/yt-dlp/releases/latest',
      headers: { 'User-Agent': 'ytdl-gui' },
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function getLocalVersion(binaryPath) {
  return new Promise((resolve) => {
    try {
      const proc = spawn(binaryPath, ['--version']);
      let out = '';
      proc.stdout.on('data', (d) => (out += d.toString()));
      proc.on('close', () => resolve(out.trim()));
      proc.on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

// ─── Command Builder ──────────────────────────────────────────────────────────
function buildCommand(config) {
  const args = [];

  // Always provide ffmpeg location so merging & post-processing work
  const ffmpegPath = getFfmpegPath();
  if (ffmpegPath) args.push('--ffmpeg-location', ffmpegPath);

  // Output template
  if (config.outputDir) {
    args.push('-o', path.join(config.outputDir, '%(title)s.%(ext)s'));
  }

  // Format selection
  if (config.format === 'best-video') {
    args.push('-f', 'bestvideo+bestaudio/best');
  } else if (config.format === 'best-audio') {
    args.push('-f', 'bestaudio/best');
  } else if (config.format === 'mp4') {
    args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]');
    args.push('--merge-output-format', 'mp4');
  } else if (config.format === 'mp3') {
    args.push('-f', 'bestaudio/best');
    args.push('-x', '--audio-format', 'mp3');
    if (config.audioQuality) args.push('--audio-quality', config.audioQuality);
  } else if (config.format === 'webm') {
    args.push('-f', 'bestvideo[ext=webm]+bestaudio[ext=webm]/best[ext=webm]');
  } else if (config.format === 'custom' && config.customFormat) {
    args.push('-f', config.customFormat);
  }

  // Resolution / Quality
  if (config.resolution && config.resolution !== 'best') {
    const h = config.resolution.replace('p', '');
    args.push('-S', `res:${h}`);
  }

  // Video codec preference
  if (config.videoCodec && config.videoCodec !== 'any') {
    const codecMap = { h264: 'avc', vp9: 'vp9', av1: 'av01', h265: 'hev' };
    args.push('--prefer-free-formats');
    args.push('-S', `vcodec:${codecMap[config.videoCodec] || config.videoCodec}`);
  }

  // HDR
  if (config.hdr) args.push('-S', 'hdr:HDR');

  // Subtitles
  if (config.embedSubs) {
    args.push('--embed-subs', '--sub-langs', config.subLangs || 'all');
    args.push('--write-auto-subs');
  }

  // Metadata & chapters
  if (config.embedMetadata) args.push('--embed-metadata');
  if (config.embedChapters) args.push('--embed-chapters');
  if (config.embedThumbnail) args.push('--embed-thumbnail');

  // Audio conversion
  if (config.audioConvert && config.audioConvertFormat) {
    args.push('-x', '--audio-format', config.audioConvertFormat);
  }

  // Proxy
  if (config.proxy) args.push('--proxy', config.proxy);

  // Cookies
  if (config.cookiesFile) args.push('--cookies', config.cookiesFile);

  // Rate limit
  if (config.rateLimit) args.push('-r', config.rateLimit);

  // Concurrent fragments
  if (config.concurrentFragments) args.push('--concurrent-fragments', String(config.concurrentFragments));

  // Playlist
  if (config.noPlaylist) args.push('--no-playlist');
  if (config.playlistStart) args.push('--playlist-start', String(config.playlistStart));
  if (config.playlistEnd) args.push('--playlist-end', String(config.playlistEnd));

  // Sponsorblock
  if (config.sponsorblock) args.push('--sponsorblock-remove', 'all');

  // Extra args
  if (config.extraArgs && config.extraArgs.trim()) {
    args.push(...config.extraArgs.trim().split(/\s+/));
  }

  // Progress output (always JSON progress)
  args.push('--progress', '--newline');
  args.push('--progress-template', '%(progress.status)s %(progress._percent_str)s %(progress._speed_str)s %(progress._eta_str)s %(progress.downloaded_bytes)s %(progress.total_bytes)s %(progress.total_bytes_estimate)s');

  // URL (always last)
  args.push(config.url);

  return args;
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
function registerIPC(win) {
  // Check binary & version
  ipcMain.handle('binary:check', async () => {
    const binPath = getBinaryPath();
    const exists = fs.existsSync(binPath);
    let localVersion = null;
    if (exists) localVersion = await getLocalVersion(binPath);
    return { exists, path: binPath, localVersion };
  });

  ipcMain.handle('binary:checkUpdate', async () => {
    try {
      const release = await fetchLatestVersion();
      const latestVersion = release.tag_name;
      const binPath = getBinaryPath();
      const exists = fs.existsSync(binPath);
      let localVersion = null;
      if (exists) localVersion = await getLocalVersion(binPath);
      const needsUpdate = !localVersion || localVersion !== latestVersion;
      return { latestVersion, localVersion, needsUpdate, exists };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('binary:download', async (_e, version) => {
    try {
      const dir = getBinaryDir();
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const binPath = getBinaryPath();
      const url = getBinaryDownloadUrl(version);
      await downloadFile(url, binPath, (pct) => {
        win.webContents.send('binary:downloadProgress', pct);
      });
      if (process.platform !== 'win32') {
        fs.chmodSync(binPath, '755');
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // Start download
  ipcMain.handle('download:start', (event, { id, config }) => {
    const binPath = getBinaryPath();
    if (!fs.existsSync(binPath)) return { success: false, error: 'yt-dlp binary not found' };

    const args = buildCommand(config);
    const proc = spawn(binPath, args, { cwd: config.outputDir || app.getPath('downloads') });

    activeProcesses.set(id, proc);

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach((line) => {
        win.webContents.send('download:stdout', { id, line });
      });
    });

    proc.stderr.on('data', (data) => {
      win.webContents.send('download:stderr', { id, line: data.toString() });
    });

    proc.on('close', (code) => {
      activeProcesses.delete(id);
      win.webContents.send('download:done', { id, code });
    });

    proc.on('error', (err) => {
      activeProcesses.delete(id);
      win.webContents.send('download:error', { id, error: err.message });
    });

    return { success: true, args };
  });

  // Pause (kill & mark paused)
  ipcMain.handle('download:cancel', (_e, id) => {
    const proc = activeProcesses.get(id);
    if (proc) {
      proc.kill('SIGTERM');
      activeProcesses.delete(id);
      return { success: true };
    }
    return { success: false, error: 'Process not found' };
  });

  // Fetch formats for URL
  ipcMain.handle('download:getFormats', async (_e, url) => {
    const binPath = getBinaryPath();
    if (!fs.existsSync(binPath)) return { success: false, error: 'Binary not found' };
    return new Promise((resolve) => {
      const proc = spawn(binPath, ['-J', '--flat-playlist', url]);
      let out = '';
      let err = '';
      proc.stdout.on('data', (d) => (out += d.toString()));
      proc.stderr.on('data', (d) => (err += d.toString()));
      proc.on('close', (code) => {
        if (code !== 0) return resolve({ success: false, error: err });
        try {
          const info = JSON.parse(out);
          resolve({ success: true, info });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
      proc.on('error', (e) => resolve({ success: false, error: e.message }));
    });
  });

  // Pick directory
  ipcMain.handle('dialog:pickDir', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Pick file (cookies)
  ipcMain.handle('dialog:pickFile', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Cookie files', extensions: ['txt', 'json'] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Open path in explorer
  ipcMain.handle('shell:openPath', (_e, p) => shell.openPath(p));

  // Get default download dir
  ipcMain.handle('app:getDownloadsDir', () => app.getPath('downloads'));

  // Build & preview command
  ipcMain.handle('download:buildCommand', (_e, config) => {
    return buildCommand(config);
  });

  // Expose ffmpeg status
  ipcMain.handle('ffmpeg:check', () => {
    const p = getFfmpegPath();
    return { exists: !!p, path: p || null };
  });
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0f14',
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0d0f14',
      symbolColor: '#8ec5ff',
      height: 40,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  registerIPC(win);
  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
