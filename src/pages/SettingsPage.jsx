import { RefreshCw, CheckCircle, Download, Cpu, Info, Globe, Sun, Moon, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n, LANGUAGE_OPTIONS } from '../i18n/index';
import { useTheme } from '../context/ThemeContext';
import Section from '../components/Section';

export default function SettingsPage() {
  const { state, actions } = useApp();
  const { binary } = state;
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-white">{t('settings.title')}</h1>
        <p className="text-sm text-surface-400 mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {/* ── Binary ── */}
      <Section title={t('settings.binary')} icon={Cpu} defaultOpen>
        <div className="glass-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-surface-200">{t('settings.status')}</p>
              <p className="text-xs text-surface-500 mt-0.5">{binary.exists ? 'binaries/yt-dlp' : '—'}</p>
            </div>
            {binary.exists
              ? <span className="badge-green"><CheckCircle size={11} /> {t('settings.installed')}</span>
              : <span className="badge-red">{t('settings.missing')}</span>
            }
          </div>

          <div className="border-t border-surface-700/40 pt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-surface-500 mb-1">{t('settings.localVersion')}</p>
              <p className="font-mono text-surface-200">{binary.localVersion || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">{t('settings.latestVersion')}</p>
              <p className="font-mono text-surface-200">{binary.latestVersion || '—'}</p>
            </div>
          </div>

          <button
            id="btn-check-update"
            onClick={() => actions.downloadBinary(binary.latestVersion)}
            disabled={!binary.latestVersion || binary.downloading}
            className="btn-primary w-full justify-center disabled:opacity-40"
          >
            {binary.exists ? <RefreshCw size={15} /> : <Download size={15} />}
            {binary.exists
              ? binary.needsUpdate
                ? t('settings.updateTo', { v: binary.latestVersion })
                : t('settings.redownload')
              : t('settings.downloadLatest', { v: binary.latestVersion || 'latest' })}
          </button>

          {binary.downloading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-surface-400">
                <span>{t('banner.download')}…</span>
                <span>{binary.downloadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${binary.downloadProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── Theme ── */}
      <Section title="Theme" icon={Palette} defaultOpen>
        <div className="flex gap-3">
          {[
            { id: 'dark', icon: Moon, label: 'Dark Mode', desc: 'Dark background, easy on the eyes' },
            { id: 'light', icon: Sun, label: 'Light Mode', desc: 'Bright and clean interface' },
          ].map(({ id, icon: Icon, label, desc }) => (
            <button
              key={id}
              id={`theme-${id}`}
              onClick={() => setTheme(id)}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200
                ${theme === id
                  ? 'bg-accent-600/20 border-2 border-accent-500/50 text-white'
                  : 'glass-sm hover:border-surface-600/60 text-surface-300 hover:text-white'
                }`}
            >
              <span className={`p-2 rounded-lg ${theme === id ? 'bg-accent-600/30' : 'bg-surface-800/60'}`}>
                <Icon size={18} className={theme === id ? 'text-accent-400' : 'text-surface-400'} />
              </span>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-surface-400 mt-0.5">{desc}</p>
              </div>
              {theme === id && <CheckCircle size={16} className="ml-auto text-accent-400 shrink-0" />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Language ── */}
      <Section title={t('settings.language')} icon={Globe} defaultOpen>
        <p className="text-xs text-surface-500 mb-3">{t('settings.languageHint')}</p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map(l => (
            <button
              key={l.code}
              id={`lang-${l.code}`}
              onClick={() => setLang(l.code)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${lang === l.code
                  ? 'bg-accent-600/20 border border-accent-500/40 text-accent-300'
                  : 'glass-sm hover:border-surface-600/60 text-surface-300 hover:text-white'
                }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && <CheckCircle size={13} className="ml-auto text-accent-400" />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── About ── */}
      <Section title={t('settings.about')} icon={Info}>
        <div className="space-y-2 text-sm text-surface-400">
          <div className="flex justify-between"><span>{t('settings.appName')}</span><span className="text-surface-200 font-medium">ytdl-gui</span></div>
          <div className="flex justify-between"><span>{t('settings.version')}</span><span className="font-mono text-surface-200">1.0.0</span></div>
          <div className="flex justify-between"><span>{t('settings.framework')}</span><span className="text-surface-200">Electron + React + Tailwind</span></div>
          <div className="flex justify-between"><span>{t('settings.poweredBy')}</span><span className="text-surface-200">yt-dlp + ffmpeg-static</span></div>
          <div className="flex justify-between border-t border-surface-700/40 pt-2 mt-2"><span>{t('settings.platform')}</span><span className="font-mono text-surface-200">{navigator.platform}</span></div>
        </div>
      </Section>
    </div>
  );
}
