import { Download, ListVideo, Settings, Terminal, LayoutList } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index';

export default function Sidebar() {
  const { state, actions } = useApp();
  const { t } = useI18n();

  const NAV = [
    { id: 'downloader', icon: Download,    labelKey: 'nav.downloader' },
    { id: 'queue',      icon: ListVideo,    labelKey: 'nav.queue'      },
    { id: 'batch',      icon: LayoutList,   labelKey: 'nav.batch'      },
    { id: 'settings',   icon: Settings,     labelKey: 'nav.settings'   },
  ];

  const queueActive = state.queue.filter(i => i.status === 'downloading' || i.status === 'queued').length;

  return (
    <aside className="w-[72px] flex flex-col items-center py-4 gap-1 bg-surface-950 border-r border-surface-800/50 shrink-0">
      {NAV.map(({ id, icon: Icon, labelKey }) => {
        const active = state.activeTab === id;
        const label = t(labelKey);
        return (
          <button
            key={id}
            id={`nav-${id}`}
            onClick={() => actions.setTab(id)}
            title={label}
            className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200
              ${active
                ? 'bg-accent-600/20 text-accent-400 shadow-inner'
                : 'text-surface-500 hover:text-surface-200 hover:bg-surface-800/50'
              }`}
          >
            <Icon size={20} />
            <span className="text-[9px] font-medium uppercase tracking-wider leading-none truncate max-w-full px-1">
              {label.slice(0, 5)}
            </span>
            {id === 'queue' && queueActive > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-500 text-white text-[9px] flex items-center justify-center font-bold">
                {queueActive}
              </span>
            )}
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent-500 rounded-r-full" />
            )}
          </button>
        );
      })}

      <div className="flex-1" />

      {/* Console toggle */}
      <button
        id="nav-console"
        onClick={actions.toggleConsole}
        title={t('nav.console')}
        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200
          ${state.consoleOpen
            ? 'bg-surface-700/60 text-accent-400'
            : 'text-surface-500 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
      >
        <Terminal size={20} />
        <span className="text-[9px] font-medium uppercase tracking-wider leading-none">{t('nav.console').slice(0, 3)}</span>
      </button>
    </aside>
  );
}
