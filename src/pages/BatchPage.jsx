import { useState } from 'react';
import {
  Tv, Link2, Play, FolderOpen, Sliders, Globe, ChevronRight,
  RefreshCw, SkipForward, CalendarRange, ArrowDownUp, Archive
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index';
import Section from '../components/Section';
import { Field, Row, Toggle, Input, NumberInput, Select } from '../components/FormParts';

const FORMAT_OPTIONS = [
  { value: 'best-video', label: '🎬 Best Video + Audio' },
  { value: 'best-audio', label: '🎵 Best Audio Only' },
  { value: 'mp4',        label: '📦 MP4' },
  { value: 'mp3',        label: '🎧 MP3' },
  { value: 'webm',       label: '🌐 WebM' },
];

export default function BatchPage() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  const cfg = state.config;

  const [activeTab, setActiveTab] = useState('urls');
  const [urlsText, setUrlsText] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limitCount, setLimitCount] = useState('50');
  const [dateAfter, setDateAfter] = useState('');
  const [dateBefore, setDateBefore] = useState('');
  const [reverseOrder, setReverseOrder] = useState(false);
  const [skipExisting, setSkipExisting] = useState(true);
  const [archiveFile, setArchiveFile] = useState('');
  const [format, setFormat] = useState('best-video');

  const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);
  const urlCount = urls.length;

  const handlePickArchive = async () => {
    const f = await window.electronAPI.pickFile();
    if (f) setArchiveFile(f);
  };

  const handlePickOutputDir = async () => {
    const dir = await window.electronAPI.pickDir();
    if (dir) actions.setConfig({ outputDir: dir });
  };

  const handleBatchStart = () => {
    if (urlCount === 0) return;
    urls.forEach(url => {
      actions.startDownload({ ...cfg, url, format });
    });
    actions.setTab('queue');
  };

  const handleChannelStart = () => {
    if (!channelUrl.trim()) return;

    // Build extra args for channel/playlist
    const extra = [];
    if (limitEnabled && limitCount) extra.push(`--playlist-end ${limitCount}`);
    if (dateAfter) extra.push(`--dateafter ${dateAfter.replace(/-/g, '')}`);
    if (dateBefore) extra.push(`--datebefore ${dateBefore.replace(/-/g, '')}`);
    if (reverseOrder) extra.push('--playlist-reverse');
    if (skipExisting && archiveFile) extra.push(`--download-archive "${archiveFile}"`);

    actions.startDownload({
      ...cfg,
      url: channelUrl,
      format,
      noPlaylist: false,
      extraArgs: extra.join(' '),
    });
    actions.setTab('queue');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-white">{t('batch.title')}</h1>
        <p className="text-sm text-surface-400 mt-0.5">{t('batch.subtitle')}</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 glass-sm rounded-xl w-fit">
        {[
          { id: 'urls',    icon: Link2, label: t('batch.tabUrls')    },
          { id: 'channel', icon: Tv,    label: t('batch.tabChannel') },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id ? 'bg-accent-600/25 text-accent-300 border border-accent-600/30' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── URL List tab ── */}
      {activeTab === 'urls' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass p-4 space-y-3">
            <Field label={t('batch.urlsLabel')} hint={t('batch.urlsHint')}>
              <textarea
                id="batch-urls-input"
                value={urlsText}
                onChange={e => setUrlsText(e.target.value)}
                placeholder={t('batch.urlsPlaceholder')}
                rows={10}
                className="input resize-none font-mono text-xs leading-relaxed"
              />
            </Field>
            <div className="flex items-center justify-between text-xs text-surface-500">
              <span>
                {urlCount > 0
                  ? t('batch.urlCount', { n: urlCount, s: urlCount !== 1 ? 's' : '' })
                  : t('batch.noUrls')}
              </span>
              {urlCount > 0 && (
                <button onClick={() => setUrlsText('')} className="btn-ghost py-0.5 px-2 text-xs">
                  <RefreshCw size={11} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Shared options */}
          <SharedOptions format={format} setFormat={setFormat} outputDir={cfg.outputDir} onPickDir={handlePickOutputDir} t={t} />

          <button
            id="btn-batch-start"
            onClick={handleBatchStart}
            disabled={urlCount === 0 || !state.binary.exists}
            className="btn-primary w-full justify-center py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={18} />
            {t('batch.startBatch', { n: urlCount })}
          </button>
        </div>
      )}

      {/* ── Channel tab ── */}
      {activeTab === 'channel' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass p-4 space-y-4">
            <Field label={t('batch.channelUrl')}>
              <Input
                id="batch-channel-url"
                value={channelUrl}
                onChange={setChannelUrl}
                placeholder={t('batch.channelPlaceholder')}
              />
            </Field>

            <Section title={t('batch.limitVideos')} icon={Sliders} defaultOpen>
              <Toggle
                id="toggle-limit"
                label={t('batch.limitVideos')}
                hint={t('batch.limitHint')}
                checked={limitEnabled}
                onChange={setLimitEnabled}
              />
              {limitEnabled && (
                <Field label="Max videos">
                  <NumberInput id="batch-limit-count" value={limitCount} onChange={setLimitCount} min={1} />
                </Field>
              )}
            </Section>

            <Section title={t('batch.dateAfter').split(' ').slice(0,2).join(' ')} icon={CalendarRange}>
              <Row>
                <Field label={t('batch.dateAfter')}>
                  <input id="batch-date-after" type="date" value={dateAfter} onChange={e => setDateAfter(e.target.value)} className="input" />
                </Field>
                <Field label={t('batch.dateBefore')}>
                  <input id="batch-date-before" type="date" value={dateBefore} onChange={e => setDateBefore(e.target.value)} className="input" />
                </Field>
              </Row>
            </Section>

            <Section title="Order & Archive" icon={Archive}>
              <Toggle
                id="toggle-reverse"
                label={t('batch.reverseOrder')}
                hint={t('batch.reverseOrderHint')}
                checked={reverseOrder}
                onChange={setReverseOrder}
              />
              <Toggle
                id="toggle-skip-existing"
                label={t('batch.skipExisting')}
                hint={t('batch.skipExistingHint')}
                checked={skipExisting}
                onChange={setSkipExisting}
              />
              {skipExisting && (
                <Field label={t('batch.archiveFile')} hint={t('batch.archiveHint')}>
                  <div className="flex gap-2">
                    <Input id="batch-archive-file" value={archiveFile} onChange={setArchiveFile} placeholder="archive.txt" />
                    <button onClick={handlePickArchive} className="btn-secondary shrink-0 px-3">
                      <FolderOpen size={15} />
                    </button>
                  </div>
                </Field>
              )}
            </Section>
          </div>

          {/* Shared options */}
          <SharedOptions format={format} setFormat={setFormat} outputDir={cfg.outputDir} onPickDir={handlePickOutputDir} t={t} />

          <button
            id="btn-channel-start"
            onClick={handleChannelStart}
            disabled={!channelUrl.trim() || !state.binary.exists}
            className="btn-primary w-full justify-center py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Tv size={18} />
            {t('batch.startChannel')}
          </button>
        </div>
      )}
    </div>
  );
}

function SharedOptions({ format, setFormat, outputDir, onPickDir, t }) {
  return (
    <div className="glass p-4 space-y-3">
      <Row>
        <Field label={t('downloader.format')}>
          <Select id="batch-format" value={format} onChange={setFormat} options={FORMAT_OPTIONS} />
        </Field>
        <Field label={t('downloader.outputDir')}>
          <div className="flex gap-2">
            <input readOnly value={outputDir} placeholder="Downloads" className="input flex-1 cursor-pointer text-xs truncate" onClick={onPickDir} />
            <button onClick={onPickDir} className="btn-secondary shrink-0 px-3">
              <FolderOpen size={15} />
            </button>
          </div>
        </Field>
      </Row>
    </div>
  );
}
