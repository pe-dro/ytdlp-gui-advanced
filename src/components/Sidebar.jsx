import { Download, ListVideo, Settings, Terminal, LayoutList, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const NAV = [
    { id: 'downloader', icon: Download,    labelKey: 'nav.downloader' },
    { id: 'queue',      icon: ListVideo,    labelKey: 'nav.queue'      },
    { id: 'batch',      icon: LayoutList,   labelKey: 'nav.batch'      },
    { id: 'settings',   icon: Settings,     labelKey: 'nav.settings'   },
  ];

  const queueActive = state.queue.filter(i => i.status === 'downloading' || i.status === 'queued').length;

  return (
    <aside className="w-full sm:w-[72px] flex flex-row sm:flex-col items-center justify-around sm:justify-start py-2 sm:py-4 px-2 sm:px-0 gap-1 bg-surface-950 border-t sm:border-t-0 sm:border-r border-surface-800/50 shrink-0 z-50 order-last sm:order-first">
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
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent-500 rounded-r-full sm:block hidden" />
            )}
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-accent-500 rounded-t-full sm:hidden block" />
            )}
          </button>
        );
      })}

      <div className="hidden sm:block flex-1" />

      {/* Theme toggle */}
      <button
        id="nav-theme"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200
          text-surface-500 hover:text-surface-200 hover:bg-surface-800/50"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        <span className="text-[9px] font-medium uppercase tracking-wider leading-none">
          {theme === 'dark' ? 'LIGHT' : 'DARK'}
        </span>
      </button>

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
