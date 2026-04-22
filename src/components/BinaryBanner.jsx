import { AlertTriangle, Download, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BinaryBanner() {
  const { state, actions } = useApp();
  const { binary } = state;

  if (binary.checking) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-900/80 border-b border-surface-800/50 text-xs text-surface-400">
        <Loader2 size={12} className="animate-spin" />
        Checking yt-dlp binary…
      </div>
    );
  }

  if (binary.downloading) {
    return (
      <div className="flex items-center gap-3 px-4 py-1.5 bg-accent-900/40 border-b border-accent-700/30 text-xs">
        <Loader2 size={12} className="animate-spin text-accent-400" />
        <span className="text-accent-300">Downloading yt-dlp {binary.latestVersion}…</span>
        <div className="flex-1 max-w-[200px] progress-bar">
          <div className="progress-fill" style={{ width: `${binary.downloadProgress}%` }} />
        </div>
        <span className="text-accent-400 font-mono">{binary.downloadProgress}%</span>
      </div>
    );
  }

  if (!binary.exists) {
    return (
      <div className="flex items-center gap-3 px-4 py-1.5 bg-danger-900/30 border-b border-danger-700/30 text-xs">
        <AlertTriangle size={12} className="text-danger-400" />
        <span className="text-danger-300">yt-dlp binary not found.</span>
        <button
          id="btn-download-binary"
          onClick={() => actions.downloadBinary(binary.latestVersion)}
          className="btn-primary py-0.5 px-2 text-xs"
        >
          <Download size={11} /> Download {binary.latestVersion}
        </button>
      </div>
    );
  }

  if (binary.needsUpdate) {
    return (
      <div className="flex items-center gap-3 px-4 py-1.5 bg-warning-900/20 border-b border-warning-700/30 text-xs">
        <RefreshCw size={12} className="text-warning-400" />
        <span className="text-warning-300">
          Update available: <span className="font-mono">{binary.localVersion}</span> →{' '}
          <span className="font-mono font-semibold">{binary.latestVersion}</span>
        </span>
        <button
          id="btn-update-binary"
          onClick={() => actions.downloadBinary(binary.latestVersion)}
          className="btn-primary py-0.5 px-2 text-xs"
        >
          <RefreshCw size={11} /> Update
        </button>
        <button
          onClick={() => {}}
          className="text-surface-500 hover:text-surface-300 ml-1 transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // All good — show a subtle status bar
  return (
    <div className="flex items-center gap-4 px-4 py-1 bg-surface-950/50 border-b border-surface-800/30 text-xs text-surface-600">
      <div className="flex items-center gap-2">
        <CheckCircle size={11} className="text-success-500" />
        <span>yt-dlp {binary.localVersion}</span>
      </div>
      <span className="text-surface-700">·</span>
      {binary.ffmpegExists ? (
        <div className="flex items-center gap-1.5 text-surface-600">
          <CheckCircle size={11} className="text-success-500" />
          <span>ffmpeg ready</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-warning-600">
          <AlertTriangle size={11} />
          <span>ffmpeg not found — merging & conversion disabled</span>
        </div>
      )}
    </div>
  );
}
