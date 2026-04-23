import { createContext, useContext, useReducer, useCallback, useRef, useEffect, useState } from 'react';

// ─── State Shape ──────────────────────────────────────────────────────────────
const initialState = {
  // Binary
  binary: { exists: false, localVersion: null, latestVersion: null, needsUpdate: false, checking: true, downloading: false, downloadProgress: 0, ffmpegExists: false, ffmpegPath: null },
  // Download queue
  queue: [],
  // Config form state
  config: {
    url: '',
    outputDir: '',
    format: 'best-video',
    resolution: 'best',
    videoCodec: 'any',
    audioQuality: '0',
    hdr: false,
    customFormat: '',
    embedSubs: false,
    subLangs: 'en',
    embedMetadata: true,
    embedChapters: true,
    embedThumbnail: false,
    audioConvert: false,
    audioConvertFormat: 'mp3',
    proxy: '',
    cookiesFile: '',
    rateLimit: '',
    concurrentFragments: 4,
    noPlaylist: false,
    playlistStart: '',
    playlistEnd: '',
    sponsorblock: false,
    extraArgs: '',
  },
  // UI
  activeTab: 'downloader',
  consoleOpen: false,
  consoleLogs: [], // { id, type, text }
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_BINARY':
      return { ...state, binary: { ...state.binary, ...action.payload } };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'RESET_CONFIG':
      return { ...state, config: { ...initialState.config, outputDir: state.config.outputDir } };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'TOGGLE_CONSOLE':
      return { ...state, consoleOpen: !state.consoleOpen };
    case 'SET_CONSOLE_OPEN':
      return { ...state, consoleOpen: action.payload };

    // Queue
    case 'QUEUE_ADD':
      return { ...state, queue: [...state.queue, action.payload] };
    case 'QUEUE_UPDATE':
      return {
        ...state,
        queue: state.queue.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };
    case 'QUEUE_REMOVE':
      return { ...state, queue: state.queue.filter((item) => item.id !== action.payload) };
    case 'QUEUE_CLEAR_DONE':
      return { ...state, queue: state.queue.filter((item) => item.status !== 'done' && item.status !== 'error') };

    // Console
    case 'CONSOLE_LOG':
      return {
        ...state,
        consoleLogs: [...state.consoleLogs.slice(-1000), action.payload],
      };
    case 'CONSOLE_CLEAR':
      return { ...state, consoleLogs: [] };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

// ─── Progress Parser ──────────────────────────────────────────────────────────
function parseProgressLine(line) {
  // Format: "status percent speed eta downloaded total totalEst"
  // e.g. "downloading  45.3% 2.50MiB/s 00:12 1234567 2345678 N/A"
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const status = parts[0];
  const percentStr = parts[1];
  const speed = parts[2] || '';
  const eta = parts[3] || '';
  const percent = parseFloat(percentStr);
  if (isNaN(percent)) return null;
  return { status, percent, speed, eta };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const logId = useRef(0);

  const addLog = useCallback((text, type = 'info') => {
    dispatch({ type: 'CONSOLE_LOG', payload: { id: logId.current++, text, type } });
  }, []);

  // ── Binary init ──
  useEffect(() => {

    const api = window.electronAPI;
    if (!api) return;

    // Listen for download progress
    const removeProg = api.onBinaryDownloadProgress((pct) => {
      dispatch({ type: 'SET_BINARY', payload: { downloadProgress: pct } });
    });

    (async () => {
      dispatch({ type: 'SET_BINARY', payload: { checking: true } });
      const info = await api.binaryCheck();
      const defaultDir = await api.getDownloadsDir();
      if (defaultDir) dispatch({ type: 'SET_CONFIG', payload: { outputDir: defaultDir } });

      // Check ffmpeg
      const ffmpegInfo = await api.ffmpegCheck();
      if (ffmpegInfo.exists) {
        addLog(`[ytdl-gui] ffmpeg found: ${ffmpegInfo.path}`, 'success');
      } else {
        addLog('[ytdl-gui] ffmpeg not found — post-processing will be limited', 'warn');
      }
      dispatch({ type: 'SET_BINARY', payload: { ffmpegExists: ffmpegInfo.exists, ffmpegPath: ffmpegInfo.path } });

      if (!info.exists) {
        addLog('[ytdl-gui] yt-dlp binary not found — checking latest version…', 'warn');
        const update = await api.binaryCheckUpdate();
        dispatch({ type: 'SET_BINARY', payload: { ...update, checking: false } });
      } else {
        addLog(`[ytdl-gui] yt-dlp found: ${info.localVersion}`, 'success');
        const update = await api.binaryCheckUpdate();
        dispatch({
          type: 'SET_BINARY',
          payload: { ...info, ...update, checking: false },
        });
        if (update.needsUpdate) {
          addLog(`[ytdl-gui] Update available: ${update.latestVersion}`, 'warn');
        }
      }
    })();

    return () => removeProg();
  }, [addLog]);

  // ── Download event listeners ──
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const removeStdout = api.onDownloadStdout(({ id, line }) => {
      addLog(line, 'info');
      const progress = parseProgressLine(line);
      if (progress) {
        dispatch({
          type: 'QUEUE_UPDATE',
          payload: {
            id,
            percent: progress.percent,
            speed: progress.speed,
            eta: progress.eta,
            status: progress.status === 'finished' ? 'processing' : 'downloading',
          },
        });
      }
    });

    const removeStderr = api.onDownloadStderr(({ id, line }) => {
      addLog(line, 'error');
      // Detect title from stderr
      const titleMatch = line.match(/\[download\]\s+Destination:\s+.+[/\\](.+)$/);
      if (titleMatch) {
        dispatch({ type: 'QUEUE_UPDATE', payload: { id, filename: titleMatch[1] } });
      }
    });

    const removeDone = api.onDownloadDone(({ id, code }) => {
      addLog(`[ytdl-gui] Process exited with code ${code}`, code === 0 ? 'success' : 'error');
      dispatch({
        type: 'QUEUE_UPDATE',
        payload: { id, status: code === 0 ? 'done' : 'error', percent: code === 0 ? 100 : undefined },
      });
    });

    const removeError = api.onDownloadError(({ id, error }) => {
      addLog(`[ytdl-gui] Error: ${error}`, 'error');
      dispatch({ type: 'QUEUE_UPDATE', payload: { id, status: 'error' } });
    });

    return () => {
      removeStdout(); removeStderr(); removeDone(); removeError();
    };
  }, [addLog]);

  // ── Actions ──
  const actions = {
    setConfig: (payload) => dispatch({ type: 'SET_CONFIG', payload }),
    resetConfig: () => dispatch({ type: 'RESET_CONFIG' }),
    setTab: (tab) => dispatch({ type: 'SET_TAB', payload: tab }),
    toggleConsole: () => dispatch({ type: 'TOGGLE_CONSOLE' }),
    clearConsole: () => dispatch({ type: 'CONSOLE_CLEAR' }),

    downloadBinary: async (version) => {
      dispatch({ type: 'SET_BINARY', payload: { downloading: true, downloadProgress: 0 } });
      addLog(`[ytdl-gui] Downloading yt-dlp ${version}…`, 'info');
      const result = await window.electronAPI.binaryDownload(version);
      if (result.success) {
        addLog('[ytdl-gui] Binary downloaded successfully!', 'success');
        const info = await window.electronAPI.binaryCheck();
        dispatch({ type: 'SET_BINARY', payload: { ...info, downloading: false, needsUpdate: false } });
      } else {
        addLog(`[ytdl-gui] Download failed: ${result.error}`, 'error');
        dispatch({ type: 'SET_BINARY', payload: { downloading: false } });
      }
    },

    startDownload: async (config) => {
      const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item = {
        id,
        url: config.url,
        title: config.url,
        filename: '',
        status: 'queued',
        percent: 0,
        speed: '',
        eta: '',
        config,
        startedAt: Date.now(),
      };
      dispatch({ type: 'QUEUE_ADD', payload: item });
      addLog(`[ytdl-gui] Starting download: ${config.url}`, 'info');

      const result = await window.electronAPI.downloadStart({ id, config });
      if (!result.success) {
        addLog(`[ytdl-gui] Failed to start: ${result.error}`, 'error');
        dispatch({ type: 'QUEUE_UPDATE', payload: { id, status: 'error' } });
      } else {
        dispatch({ type: 'QUEUE_UPDATE', payload: { id, status: 'downloading' } });
        addLog(`[ytdl-gui] Command: yt-dlp ${result.args.join(' ')}`, 'cmd');
      }
    },

    cancelDownload: async (id) => {
      await window.electronAPI.downloadCancel(id);
      dispatch({ type: 'QUEUE_UPDATE', payload: { id, status: 'cancelled' } });
      addLog(`[ytdl-gui] Cancelled download ${id}`, 'warn');
    },

    removeFromQueue: (id) => dispatch({ type: 'QUEUE_REMOVE', payload: id }),
    clearDone: () => dispatch({ type: 'QUEUE_CLEAR_DONE' }),
    addLog,
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
