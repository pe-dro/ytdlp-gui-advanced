import { Download, X, CheckCircle, AlertCircle, Clock, Loader2, Trash2, FolderOpen, StopCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index';

function statusMeta(status) {
  switch (status) {
    case 'queued':      return { label: 'Queued',      icon: Clock,        color: 'text-surface-400', badge: 'badge-blue' };
    case 'downloading': return { label: 'Downloading', icon: Loader2,      color: 'text-accent-400',  badge: 'badge-blue' };
    case 'processing':  return { label: 'Processing',  icon: Loader2,      color: 'text-warning-400', badge: 'badge-yellow' };
    case 'done':        return { label: 'Done',         icon: CheckCircle,  color: 'text-success-400', badge: 'badge-green' };
    case 'error':       return { label: 'Error',        icon: AlertCircle,  color: 'text-danger-400',  badge: 'badge-red' };
    case 'cancelled':   return { label: 'Cancelled',    icon: StopCircle,   color: 'text-surface-500', badge: 'badge-yellow' };
    default:            return { label: status,          icon: Clock,        color: 'text-surface-400', badge: 'badge-blue' };
  }
}

function QueueItem({ item }) {
  const { actions } = useApp();
  const meta = statusMeta(item.status);
  const StatusIcon = meta.icon;
  const isActive = item.status === 'downloading' || item.status === 'processing';

  const handleOpenDir = () => {
    if (item.config?.outputDir) {
      window.electronAPI.openPath(item.config.outputDir);
    }
  };

  return (
    <div className="glass p-4 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <span className={`mt-0.5 shrink-0 ${meta.color}`}>
          <StatusIcon size={18} className={isActive ? 'animate-spin' : ''} />
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate" title={item.title}>
            {item.filename || item.url}
          </p>
          <p className="text-xs text-surface-500 truncate mt-0.5">{item.url}</p>
        </div>

        {/* Badge + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={meta.badge}>{meta.label}</span>

          {item.status === 'done' && (
            <button
              id={`btn-open-dir-${item.id}`}
              onClick={handleOpenDir}
              className="btn-icon p-1.5"
              title="Open folder"
            >
              <FolderOpen size={14} />
            </button>
          )}

          {isActive && (
            <button
              id={`btn-cancel-${item.id}`}
              onClick={() => actions.cancelDownload(item.id)}
              className="btn-danger py-1 px-2 text-xs"
              title="Cancel"
            >
              <X size={13} /> Cancel
            </button>
          )}

          {!isActive && (
            <button
              id={`btn-remove-${item.id}`}
              onClick={() => actions.removeFromQueue(item.id)}
              className="btn-icon p-1.5 hover:text-danger-400"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className={`progress-bar ${isActive && item.percent === 0 ? 'progress-indeterminate' : ''}`}>
        <div
          className="progress-fill"
          style={{ width: `${item.percent || 0}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-surface-500 font-mono">
        <span>{item.percent != null ? `${item.percent.toFixed(1)}%` : '—'}</span>
        {item.speed && <span>⚡ {item.speed}</span>}
        {item.eta && <span>⏱ ETA {item.eta}</span>}
        {item.startedAt && (
          <span className="ml-auto">
            Started {new Date(item.startedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function QueuePage() {
  const { state, actions } = useApp();
  const { queue } = state;

  const activeCount  = queue.filter((i) => i.status === 'downloading' || i.status === 'queued').length;
  const doneCount    = queue.filter((i) => i.status === 'done').length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Download Queue</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {activeCount > 0 ? `${activeCount} active` : 'No active downloads'}
            {doneCount > 0 && ` · ${doneCount} completed`}
          </p>
        </div>
        {doneCount > 0 && (
          <button
            id="btn-clear-done"
            onClick={actions.clearDone}
            className="btn-ghost text-xs gap-1.5"
          >
            <Trash2 size={13} /> Clear Completed
          </button>
        )}
      </div>

      {/* Queue list */}
      {queue.length === 0 ? (
        <div className="glass p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-800/60 flex items-center justify-center">
            <Download size={28} className="text-surface-600" />
          </div>
          <div>
            <p className="text-surface-300 font-medium">No downloads yet</p>
            <p className="text-surface-500 text-sm mt-1">Head to the Downloader tab to start a new download</p>
          </div>
          <button
            onClick={() => actions.setTab('downloader')}
            className="btn-primary mt-2"
          >
            Start a Download
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <QueueItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
