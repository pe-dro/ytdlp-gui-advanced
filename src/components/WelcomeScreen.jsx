import { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle, Loader2, Globe, Film, ListVideo, Terminal, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n, LANGUAGE_OPTIONS } from '../i18n/index';

const STEPS = ['features', 'setup', 'language'];

export default function WelcomeScreen({ onDone }) {
  const { state, actions } = useApp();
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(0);
  const [setupDone, setSetupDone] = useState(false);

  const { binary } = state;
  const canProceed = step < 2 || setupDone || binary.exists;

  useEffect(() => {
    if (binary.exists && !binary.needsUpdate) setSetupDone(true);
    if (binary.exists && binary.downloading === false) setSetupDone(true);
  }, [binary.exists, binary.downloading, binary.needsUpdate]);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else { localStorage.setItem('ytdl-gui-welcomed', '1'); onDone(); }
  };

  const features = [
    { icon: Film,      key: 'formats' },
    { icon: ListVideo, key: 'queue'   },
    { icon: Download,  key: 'batch'   },
    { icon: Terminal,  key: 'console' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-surface-950/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-2xl glass rounded-2xl overflow-hidden shadow-2xl shadow-black/50">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-accent-500' : i < step ? 'w-3 bg-accent-700' : 'w-3 bg-surface-700'}`} />
          ))}
        </div>

        <div className="px-8 pb-8 pt-4 min-h-[420px] flex flex-col">

          {/* ── Step 0: Features ── */}
          {step === 0 && (
            <div className="flex flex-col flex-1 animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center shadow-lg shadow-accent-900/50">
                  <Sparkles size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">{t('welcome.title')}</h1>
                <p className="text-surface-400 mt-2">{t('welcome.subtitle')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {features.map(({ icon: Icon, key }) => (
                  <div key={key} className="glass-sm p-4 flex items-start gap-3 rounded-xl hover:border-accent-600/30 transition-colors">
                    <span className="p-2 rounded-lg bg-accent-600/20 text-accent-400 shrink-0 mt-0.5">
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t(`welcome.features.${key}.title`)}</p>
                      <p className="text-xs text-surface-400 mt-0.5 leading-relaxed">{t(`welcome.features.${key}.desc`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Setup ── */}
          {step === 1 && (
            <div className="flex flex-col flex-1 animate-slide-up">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">{t('welcome.step2.title')}</h2>
                <p className="text-surface-400 mt-1 text-sm">{t('welcome.step2.desc')}</p>
              </div>

              <div className="space-y-3 flex-1">
                {/* yt-dlp status */}
                <StatusRow
                  label="yt-dlp"
                  checking={binary.checking}
                  found={binary.exists}
                  version={binary.localVersion}
                  latestVersion={binary.latestVersion}
                  downloading={binary.downloading}
                  downloadPct={binary.downloadProgress}
                  foundText={t('welcome.ytdlpFound', { version: binary.localVersion || '' })}
                  missingText={t('welcome.ytdlpMissing')}
                  downloadingText={t('welcome.downloading', { pct: binary.downloadProgress })}
                  onDownload={() => actions.downloadBinary(binary.latestVersion)}
                  downloadLabel={t('welcome.downloadYtdlp')}
                  needsUpdate={binary.needsUpdate}
                />

                {/* ffmpeg status */}
                <StatusRow
                  label="ffmpeg"
                  checking={binary.checking}
                  found={binary.ffmpegExists}
                  foundText={t('welcome.ffmpegFound')}
                  missingText={t('welcome.ffmpegMissing')}
                  warnOnly
                />

                {/* Update notice */}
                {binary.needsUpdate && binary.exists && (
                  <div className="glass-sm p-3 border-warning-600/30 bg-warning-900/10 rounded-lg text-xs text-warning-300 flex items-center gap-2">
                    <AlertCircle size={13} className="text-warning-400 shrink-0" />
                    {t('banner.updateAvailable')}: {binary.localVersion} → {binary.latestVersion}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Language ── */}
          {step === 2 && (
            <div className="flex flex-col flex-1 animate-slide-up">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">{t('welcome.step3.title')}</h2>
                <p className="text-surface-400 mt-1 text-sm">{t('welcome.step3.desc')}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${lang === l.code
                        ? 'bg-accent-600/25 border border-accent-500/50 text-white'
                        : 'glass-sm hover:border-surface-600/60 text-surface-300 hover:text-white'
                      }`}
                  >
                    <span className="text-lg">{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <CheckCircle size={14} className="ml-auto text-accent-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer buttons ── */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-700/40">
            <button
              onClick={() => step > 0 ? setStep(s => s - 1) : null}
              className={`btn-ghost text-sm ${step === 0 ? 'invisible' : ''}`}
            >
              <ChevronLeft size={16} /> {t('welcome.back')}
            </button>

            <button
              onClick={() => { localStorage.setItem('ytdl-gui-welcomed', '1'); onDone(); }}
              className="btn-ghost text-surface-500 text-xs"
            >
              {t('welcome.skip')}
            </button>

            <button
              onClick={handleNext}
              disabled={step === 1 && binary.downloading}
              className="btn-primary disabled:opacity-50"
            >
              {step === STEPS.length - 1 ? (
                <><CheckCircle size={16} /> {t('welcome.getStarted')}</>
              ) : (
                <>{t('welcome.next')} <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, checking, found, version, downloading, downloadPct, foundText, missingText, downloadingText, onDownload, downloadLabel, warnOnly, needsUpdate }) {
  const { t } = useI18n();
  return (
    <div className="glass-sm p-4 rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {checking ? (
            <Loader2 size={18} className="animate-spin text-surface-500" />
          ) : found ? (
            <CheckCircle size={18} className="text-success-400" />
          ) : (
            <AlertCircle size={18} className={warnOnly ? 'text-warning-400' : 'text-danger-400'} />
          )}
          <div>
            <p className="text-sm font-semibold text-white font-mono">{label}</p>
            <p className={`text-xs mt-0.5 ${found ? 'text-success-400' : warnOnly ? 'text-warning-400' : 'text-danger-400'}`}>
              {checking ? t('welcome.checking') : found ? foundText : missingText}
            </p>
          </div>
        </div>
        {!found && !checking && onDownload && !downloading && (
          <button onClick={onDownload} className="btn-primary py-1.5 px-3 text-xs shrink-0">
            <Download size={13} /> {downloadLabel}
          </button>
        )}
      </div>
      {downloading && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-accent-300">{downloadingText}</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${downloadPct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
