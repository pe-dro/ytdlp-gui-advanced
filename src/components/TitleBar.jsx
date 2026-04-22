import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  return (
    <div className="titlebar-drag h-10 flex items-center justify-between px-4 bg-surface-950/95 border-b border-surface-800/50 shrink-0 z-50">
      <div className="titlebar-no-drag flex items-center gap-2.5">
        {/* Logo */}
        <div className="w-6 h-6 rounded bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">▼</span>
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">ytdl-gui</span>
        <span className="text-xs text-surface-500 font-mono">yt-dlp frontend</span>
      </div>

      {/* Window controls — only shown on non-mac */}
      <div className="titlebar-no-drag flex items-center gap-1">
        <button
          id="win-minimize"
          onClick={() => window.electronAPI?.minimize?.()}
          className="btn-icon text-surface-400 hover:text-white"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          id="win-maximize"
          onClick={() => window.electronAPI?.maximize?.()}
          className="btn-icon text-surface-400 hover:text-white"
          title="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          id="win-close"
          onClick={() => window.electronAPI?.closeWindow?.()}
          className="btn-icon hover:bg-danger-600/20 hover:text-danger-400"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
