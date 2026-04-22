import { useState } from 'react';
import {
  Link, FolderOpen, Film, Zap, Sliders, Globe, ListChecks,
  Play, Eye, RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index';
import Section from '../components/Section';
import { Field, Row, Toggle, Select, Input, NumberInput } from '../components/FormParts';
import { FieldHelp } from '../components/Popover';
import SupportedSites from '../components/SupportedSites';

// ─── Config sections data ─────────────────────────────────────────────────────
const FORMAT_OPTIONS = [
  { value: 'best-video', label: '🎬 Best Video + Audio' },
  { value: 'best-audio', label: '🎵 Best Audio Only' },
  { value: 'mp4',        label: '📦 MP4 (H.264)' },
  { value: 'mp3',        label: '🎧 MP3 Audio' },
  { value: 'webm',       label: '🌐 WebM' },
  { value: 'custom',     label: '⚙️  Custom Format String' },
];

const RESOLUTION_OPTIONS = [
  { value: 'best',  label: 'Best Available' },
  { value: '4320p', label: '8K (4320p)' },
  { value: '2160p', label: '4K (2160p)' },
  { value: '1440p', label: '1440p QHD' },
  { value: '1080p', label: '1080p Full HD' },
  { value: '720p',  label: '720p HD' },
  { value: '480p',  label: '480p SD' },
  { value: '360p',  label: '360p' },
];

const CODEC_OPTIONS = [
  { value: 'any',  label: 'Any Codec' },
  { value: 'h264', label: 'H.264 (AVC)' },
  { value: 'h265', label: 'H.265 (HEVC)' },
  { value: 'vp9',  label: 'VP9' },
  { value: 'av1',  label: 'AV1' },
];

const AUDIO_QUALITY_OPTIONS = [
  { value: '0', label: 'Best (0)' },
  { value: '2', label: 'High (2)' },
  { value: '5', label: 'Medium (5)' },
  { value: '9', label: 'Low (9)' },
];

const AUDIO_FORMAT_OPTIONS = [
  { value: 'mp3', label: 'MP3' },
  { value: 'aac', label: 'AAC' },
  { value: 'opus', label: 'Opus' },
  { value: 'flac', label: 'FLAC' },
  { value: 'wav', label: 'WAV' },
  { value: 'm4a', label: 'M4A' },
];

// ─── Field explanations ───────────────────────────────────────────────────────
const HELP = {
  url: 'The URL of the video, playlist, or channel you want to download. yt-dlp supports 1800+ websites including YouTube, Vimeo, TikTok, Instagram, Twitter/X, Reddit, and many more.',
  outputDir: 'The folder where downloaded files will be saved. Default is a "ytdl-gui" subfolder inside your Downloads directory. Files are named using the video title.',
  format: 'Determines the output file type. "Best Video + Audio" merges the highest quality streams. "MP4" forces H.264 container for maximum compatibility. "MP3" extracts audio only. "Custom" lets you write raw yt-dlp format strings.',
  customFormat: 'A yt-dlp format selector string for advanced users. Examples:\n• bestvideo[height<=1080]+bestaudio — 1080p max\n• bestvideo[ext=mp4]+bestaudio[ext=m4a] — MP4 only\n• bestaudio[acodec=opus] — Opus audio',
  audioQuality: 'VBR quality scale from 0 (best, ~245kbps) to 9 (worst, ~65kbps). Only applies to MP3 output. Most users should use 0 or 2.',
  resolution: 'Sets the maximum video resolution. yt-dlp will pick the closest match available. "Best Available" means no cap — could be 4K or 8K if the source has it.',
  codec: 'Preferred video codec. H.264 is the most compatible, AV1 offers the best compression but may not play on older devices. VP9 is YouTube\'s default for high-res.',
  hdr: 'When enabled, yt-dlp will prefer HDR streams (HDR10, Dolby Vision). Your player must support HDR to see the difference. Falls back to SDR if unavailable.',
  embedSubs: 'Downloads subtitles and embeds them into the video container (MKV/MP4). Subtitles become selectable in your video player instead of separate .srt files.',
  subLangs: 'Comma-separated language codes for subtitles. Examples:\n• en — English only\n• en,pt,es — English, Portuguese, Spanish\n• all — All available languages\nAlso downloads auto-generated captions.',
  embedMetadata: 'Writes title, artist, album, date, description and other metadata tags into the file. Useful for media library organization.',
  embedChapters: 'Embeds chapter markers from the video into the container. Works with MKV and MP4. Allows jumping between sections in your video player.',
  embedThumbnail: 'Embeds the video thumbnail as album art / cover image. Especially useful for audio downloads that display in music players.',
  sponsorblock: 'Uses the SponsorBlock community database to automatically cut out sponsor reads, intros, outros, and self-promotion segments from the downloaded video.',
  audioConvert: 'Re-encodes the audio track to the chosen format after download. Requires ffmpeg. The original stream is transcoded, which may slightly reduce quality.',
  audioConvertFormat: 'Target audio format:\n• MP3 — Universal compatibility\n• AAC — Apple ecosystem\n• Opus — Best quality/size ratio\n• FLAC — Lossless, large files\n• WAV — Uncompressed raw audio',
  proxy: 'Route all traffic through a proxy server. Useful for bypassing geo-restrictions or network firewalls. Supports HTTP, HTTPS, and SOCKS5 protocols.',
  rateLimit: 'Maximum download speed. Use K for kilobytes/s or M for megabytes/s. Example: "1M" = 1 MB/s max. Leave empty for unlimited speed.',
  concurrent: 'Number of fragments to download in parallel. DASH and HLS streams are split into many small fragments. Higher values = faster downloads but more bandwidth usage. Default is 1.',
  cookiesFile: 'A Netscape-format cookies.txt file for accessing age-gated, subscriber-only, or region-locked content. Export cookies from your browser using a cookie export extension.',
  noPlaylist: 'When a URL points to both a video and a playlist (e.g. YouTube watch URL with list= parameter), download only the single video, not the entire playlist.',
  playlistStart: 'Start downloading from this playlist position (1-indexed). Useful for resuming interrupted playlist downloads.',
  playlistEnd: 'Stop downloading at this playlist position. Combined with Start Index, lets you download a specific range of videos from a playlist.',
  extraArgs: 'Raw command-line arguments appended directly to the yt-dlp command. For power users who need flags not covered by the GUI. Separate multiple args with spaces.',
};

export default function DownloaderPage() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  const cfg = state.config;
  const set = (k) => (v) => actions.setConfig({ [k]: v });

  const [previewCmd, setPreviewCmd] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handlePickDir = async () => {
    const dir = await window.electronAPI.pickDir();
    if (dir) actions.setConfig({ outputDir: dir });
  };

  const handlePickCookies = async () => {
    const file = await window.electronAPI.pickFile();
    if (file) actions.setConfig({ cookiesFile: file });
  };

  const handlePreview = async () => {
    if (!cfg.url) return;
    const args = await window.electronAPI.downloadBuildCommand(cfg);
    setPreviewCmd('yt-dlp ' + args.join(' '));
    setShowPreview(true);
  };

  const handleStart = () => {
    if (!cfg.url.trim()) return;
    actions.startDownload({ ...cfg });
    actions.setTab('queue');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-white">{t('downloader.title')}</h1>
          <p className="text-sm text-surface-400 mt-0.5">{t('downloader.subtitle')}</p>
        </div>
        <button id="btn-reset-config" onClick={actions.resetConfig} className="btn-ghost text-xs gap-1.5">
          <RotateCcw size={13} /> {t('downloader.reset')}
        </button>
      </div>

      {/* ── Basic ─────────────────────────────────────────────────────────── */}
      <Section title={t('downloader.basic')} icon={Link} defaultOpen>
        <Field label={<>{t('downloader.url')} <FieldHelp text={HELP.url} title="URL" /> <SupportedSites className="ml-0.5" /></>}>
          <Input
            id="input-url"
            value={cfg.url}
            onChange={set('url')}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </Field>
        <Row>
          <Field label={<>{t('downloader.outputDir')} <FieldHelp text={HELP.outputDir} title={t('downloader.outputDir')} /></>}>
            <div className="flex gap-2">
              <input
                id="input-output-dir"
                readOnly
                value={cfg.outputDir}
                placeholder="Downloads folder"
                className="input flex-1 cursor-pointer text-xs truncate"
                onClick={handlePickDir}
              />
              <button id="btn-pick-dir" onClick={handlePickDir} className="btn-secondary shrink-0 px-3">
                <FolderOpen size={15} />
              </button>
            </div>
          </Field>
          <Field label={<>{t('downloader.format')} <FieldHelp text={HELP.format} title={t('downloader.format')} /></>}>
            <Select id="select-format" value={cfg.format} onChange={set('format')} options={FORMAT_OPTIONS} />
          </Field>
        </Row>
        {cfg.format === 'custom' && (
          <Field label={<>{t('downloader.customFormat')} <FieldHelp text={HELP.customFormat} title={t('downloader.customFormat')} /></>}>
            <Input id="input-custom-format" value={cfg.customFormat} onChange={set('customFormat')} placeholder="bestvideo+bestaudio" />
          </Field>
        )}
        {cfg.format === 'mp3' && (
          <Field label={<>{t('downloader.audioQuality')} <FieldHelp text={HELP.audioQuality} title={t('downloader.audioQuality')} /></>}>
            <Select id="select-audio-quality" value={cfg.audioQuality} onChange={set('audioQuality')} options={AUDIO_QUALITY_OPTIONS} />
          </Field>
        )}
      </Section>

      {/* ── Quality & Codecs ──────────────────────────────────────────────── */}
      <Section title={t('downloader.quality')} icon={Sliders}>
        <Row>
          <Field label={<>{t('downloader.resolution')} <FieldHelp text={HELP.resolution} title={t('downloader.resolution')} /></>}>
            <Select id="select-resolution" value={cfg.resolution} onChange={set('resolution')} options={RESOLUTION_OPTIONS} />
          </Field>
          <Field label={<>{t('downloader.codec')} <FieldHelp text={HELP.codec} title={t('downloader.codec')} /></>}>
            <Select id="select-codec" value={cfg.videoCodec} onChange={set('videoCodec')} options={CODEC_OPTIONS} />
          </Field>
        </Row>
        <Toggle id="toggle-hdr" label={<>{t('downloader.hdr')} <FieldHelp text={HELP.hdr} title={t('downloader.hdr')} /></>} hint={t('downloader.hdrHint')} checked={cfg.hdr} onChange={set('hdr')} />
      </Section>

      {/* ── Post-Processing ───────────────────────────────────────────────── */}
      <Section title={t('downloader.post')} icon={Film}>
        <Toggle id="toggle-embed-subs" label={<>{t('downloader.embedSubs')} <FieldHelp text={HELP.embedSubs} title={t('downloader.embedSubs')} /></>} hint={t('downloader.embedSubsHint')} checked={cfg.embedSubs} onChange={set('embedSubs')} />
        {cfg.embedSubs && (
          <Field label={<>{t('downloader.subLangs')} <FieldHelp text={HELP.subLangs} title={t('downloader.subLangs')} /></>}>
            <Input id="input-sub-langs" value={cfg.subLangs} onChange={set('subLangs')} placeholder="en" />
          </Field>
        )}
        <Toggle id="toggle-embed-metadata" label={<>{t('downloader.embedMetadata')} <FieldHelp text={HELP.embedMetadata} title={t('downloader.embedMetadata')} /></>} checked={cfg.embedMetadata} onChange={set('embedMetadata')} />
        <Toggle id="toggle-embed-chapters" label={<>{t('downloader.embedChapters')} <FieldHelp text={HELP.embedChapters} title={t('downloader.embedChapters')} /></>} checked={cfg.embedChapters} onChange={set('embedChapters')} />
        <Toggle id="toggle-embed-thumbnail" label={<>{t('downloader.embedThumbnail')} <FieldHelp text={HELP.embedThumbnail} title={t('downloader.embedThumbnail')} /></>} checked={cfg.embedThumbnail} onChange={set('embedThumbnail')} />
        <Toggle
          id="toggle-sponsorblock"
          label={<>{t('downloader.sponsorblock')} <FieldHelp text={HELP.sponsorblock} title="SponsorBlock" /></>}
          hint={t('downloader.sponsorblockHint')}
          checked={cfg.sponsorblock}
          onChange={set('sponsorblock')}
        />
        <div className="border-t border-surface-700/50 pt-3">
          <Toggle id="toggle-audio-convert" label={<>{t('downloader.audioConvert')} <FieldHelp text={HELP.audioConvert} title={t('downloader.audioConvert')} /></>} hint={t('downloader.audioConvertHint')} checked={cfg.audioConvert} onChange={set('audioConvert')} />
          {cfg.audioConvert && (
            <Field label={<>{t('downloader.audioFormat')} <FieldHelp text={HELP.audioConvertFormat} title={t('downloader.audioFormat')} /></>} className="mt-2">
              <Select id="select-audio-convert-format" value={cfg.audioConvertFormat} onChange={set('audioConvertFormat')} options={AUDIO_FORMAT_OPTIONS} />
            </Field>
          )}
        </div>
      </Section>

      {/* ── Playlist ─────────────────────────────────────────────────────── */}
      <Section title={t('downloader.playlist')} icon={ListChecks}>
        <Toggle id="toggle-no-playlist" label={<>{t('downloader.noPlaylist')} <FieldHelp text={HELP.noPlaylist} title={t('downloader.noPlaylist')} /></>} hint={t('downloader.noPlaylistHint')} checked={cfg.noPlaylist} onChange={set('noPlaylist')} />
        {!cfg.noPlaylist && (
          <Row>
            <Field label={<>{t('downloader.playlistStart')} <FieldHelp text={HELP.playlistStart} title={t('downloader.playlistStart')} /></>}>
              <NumberInput id="input-playlist-start" value={cfg.playlistStart} onChange={set('playlistStart')} min={1} />
            </Field>
            <Field label={<>{t('downloader.playlistEnd')} <FieldHelp text={HELP.playlistEnd} title={t('downloader.playlistEnd')} /></>}>
              <NumberInput id="input-playlist-end" value={cfg.playlistEnd} onChange={set('playlistEnd')} min={1} />
            </Field>
          </Row>
        )}
      </Section>

      {/* ── Network & Auth ────────────────────────────────────────────────── */}
      <Section title={t('downloader.network')} icon={Globe}>
        <Row>
          <Field label={<>{t('downloader.proxy')} <FieldHelp text={HELP.proxy} title={t('downloader.proxy')} /></>}>
            <Input id="input-proxy" value={cfg.proxy} onChange={set('proxy')} placeholder="http://127.0.0.1:8080" />
          </Field>
          <Field label={<>{t('downloader.rateLimit')} <FieldHelp text={HELP.rateLimit} title={t('downloader.rateLimit')} /></>}>
            <Input id="input-rate-limit" value={cfg.rateLimit} onChange={set('rateLimit')} placeholder="1M" />
          </Field>
        </Row>
        <Row>
          <Field label={<>{t('downloader.concurrent')} <FieldHelp text={HELP.concurrent} title={t('downloader.concurrent')} /></>}>
            <NumberInput id="input-concurrent" value={cfg.concurrentFragments} onChange={set('concurrentFragments')} min={1} max={16} />
          </Field>
          <Field label={<>{t('downloader.cookiesFile')} <FieldHelp text={HELP.cookiesFile} title={t('downloader.cookiesFile')} /></>}>
            <div className="flex gap-2">
              <input id="input-cookies" readOnly value={cfg.cookiesFile} placeholder="No file selected" className="input flex-1 cursor-pointer" onClick={handlePickCookies} />
              <button id="btn-pick-cookies" onClick={handlePickCookies} className="btn-secondary shrink-0 px-3">
                <FolderOpen size={15} />
              </button>
            </div>
          </Field>
        </Row>
      </Section>

      {/* ── Extra Args ────────────────────────────────────────────────────── */}
      <Section title={t('downloader.advanced')} icon={Zap}>
        <Field label={<>{t('downloader.extraArgs')} <FieldHelp text={HELP.extraArgs} title={t('downloader.extraArgs')} /></>}>
          <textarea
            id="input-extra-args"
            value={cfg.extraArgs}
            onChange={(e) => actions.setConfig({ extraArgs: e.target.value })}
            placeholder="--no-overwrites --write-info-json"
            rows={3}
            className="input resize-none font-mono text-xs"
          />
        </Field>
      </Section>

      {/* ── Command Preview ───────────────────────────────────────────────── */}
      {showPreview && (
        <div className="glass-sm p-3 animate-slide-up">
          <p className="text-xs text-surface-500 mb-1 uppercase tracking-wider font-medium">{t('downloader.cmdPreview')}</p>
          <code className="text-xs font-mono text-accent-300 break-all select-text">{previewCmd}</code>
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2 pb-8">
        <button
          id="btn-start-download"
          onClick={handleStart}
          disabled={!cfg.url.trim() || !state.binary.exists}
          className="btn-primary flex-1 justify-center py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play size={18} /> {t('downloader.start')}
        </button>
        <button
          id="btn-preview-cmd"
          onClick={handlePreview}
          disabled={!cfg.url.trim()}
          className="btn-secondary py-3 px-4 disabled:opacity-40"
          title={t('downloader.preview')}
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
}
