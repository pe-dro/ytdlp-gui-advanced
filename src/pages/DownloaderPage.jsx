import { useState } from 'react';
import {
  Link, FolderOpen, Film, Zap, Sliders, Globe, ListChecks,
  Play, Eye, RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/index';
import Section from '../components/Section';
import { Field, Row, Toggle, Select, Input, NumberInput } from '../components/FormParts';

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
    // Switch to queue tab
    actions.setTab('queue');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-white">New Download</h1>
          <p className="text-sm text-surface-400 mt-0.5">Configure and start your download below</p>
        </div>
        <button id="btn-reset-config" onClick={actions.resetConfig} className="btn-ghost text-xs gap-1.5">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* ── Basic ─────────────────────────────────────────────────────────── */}
      <Section title="Basic" icon={Link} defaultOpen>
        <Field label="URL" hint="YouTube, Vimeo, Twitter, SoundCloud and 1000+ more">
          <Input
            id="input-url"
            value={cfg.url}
            onChange={set('url')}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </Field>
        <Row>
          <Field label="Output Directory">
            <div className="flex gap-2">
              <input
                id="input-output-dir"
                readOnly
                value={cfg.outputDir}
                placeholder="Downloads folder"
                className="input flex-1 cursor-pointer"
                onClick={handlePickDir}
              />
              <button id="btn-pick-dir" onClick={handlePickDir} className="btn-secondary shrink-0 px-3">
                <FolderOpen size={15} />
              </button>
            </div>
          </Field>
          <Field label="Format">
            <Select id="select-format" value={cfg.format} onChange={set('format')} options={FORMAT_OPTIONS} />
          </Field>
        </Row>
        {cfg.format === 'custom' && (
          <Field label="Custom Format String" hint='e.g. "bestvideo[height<=1080]+bestaudio/best"'>
            <Input id="input-custom-format" value={cfg.customFormat} onChange={set('customFormat')} placeholder="bestvideo+bestaudio" />
          </Field>
        )}
        {cfg.format === 'mp3' && (
          <Field label="Audio Quality">
            <Select id="select-audio-quality" value={cfg.audioQuality} onChange={set('audioQuality')} options={AUDIO_QUALITY_OPTIONS} />
          </Field>
        )}
      </Section>

      {/* ── Quality & Codecs ──────────────────────────────────────────────── */}
      <Section title="Quality & Codecs" icon={Sliders}>
        <Row>
          <Field label="Max Resolution">
            <Select id="select-resolution" value={cfg.resolution} onChange={set('resolution')} options={RESOLUTION_OPTIONS} />
          </Field>
          <Field label="Video Codec Preference">
            <Select id="select-codec" value={cfg.videoCodec} onChange={set('videoCodec')} options={CODEC_OPTIONS} />
          </Field>
        </Row>
        <Toggle id="toggle-hdr" label="Prefer HDR" hint="Download HDR version if available" checked={cfg.hdr} onChange={set('hdr')} />
      </Section>

      {/* ── Post-Processing ───────────────────────────────────────────────── */}
      <Section title="Post-Processing" icon={Film}>
        <Toggle id="toggle-embed-subs" label="Embed Subtitles" hint="Download and embed subtitles into container" checked={cfg.embedSubs} onChange={set('embedSubs')} />
        {cfg.embedSubs && (
          <Field label="Subtitle Languages" hint='e.g. "en,pt" or "all"'>
            <Input id="input-sub-langs" value={cfg.subLangs} onChange={set('subLangs')} placeholder="en" />
          </Field>
        )}
        <Toggle id="toggle-embed-metadata" label="Embed Metadata" checked={cfg.embedMetadata} onChange={set('embedMetadata')} />
        <Toggle id="toggle-embed-chapters" label="Embed Chapters" checked={cfg.embedChapters} onChange={set('embedChapters')} />
        <Toggle id="toggle-embed-thumbnail" label="Embed Thumbnail" checked={cfg.embedThumbnail} onChange={set('embedThumbnail')} />
        <Toggle
          id="toggle-sponsorblock"
          label="SponsorBlock"
          hint="Remove sponsor segments automatically"
          checked={cfg.sponsorblock}
          onChange={set('sponsorblock')}
        />
        <div className="border-t border-surface-700/50 pt-3">
          <Toggle id="toggle-audio-convert" label="Convert Audio" hint="Re-encode audio to chosen format" checked={cfg.audioConvert} onChange={set('audioConvert')} />
          {cfg.audioConvert && (
            <Field label="Output Format" className="mt-2">
              <Select id="select-audio-convert-format" value={cfg.audioConvertFormat} onChange={set('audioConvertFormat')} options={AUDIO_FORMAT_OPTIONS} />
            </Field>
          )}
        </div>
      </Section>

      {/* ── Playlist ─────────────────────────────────────────────────────── */}
      <Section title="Playlist" icon={ListChecks}>
        <Toggle id="toggle-no-playlist" label="Single Video Only" hint="Ignore playlist, download only the linked video" checked={cfg.noPlaylist} onChange={set('noPlaylist')} />
        {!cfg.noPlaylist && (
          <Row>
            <Field label="Start Index">
              <NumberInput id="input-playlist-start" value={cfg.playlistStart} onChange={set('playlistStart')} min={1} />
            </Field>
            <Field label="End Index">
              <NumberInput id="input-playlist-end" value={cfg.playlistEnd} onChange={set('playlistEnd')} min={1} />
            </Field>
          </Row>
        )}
      </Section>

      {/* ── Network & Auth ────────────────────────────────────────────────── */}
      <Section title="Network & Authentication" icon={Globe}>
        <Row>
          <Field label="Proxy URL" hint="http://proxy:port or socks5://...">
            <Input id="input-proxy" value={cfg.proxy} onChange={set('proxy')} placeholder="http://127.0.0.1:8080" />
          </Field>
          <Field label="Rate Limit" hint="e.g. 1M, 500K">
            <Input id="input-rate-limit" value={cfg.rateLimit} onChange={set('rateLimit')} placeholder="1M" />
          </Field>
        </Row>
        <Row>
          <Field label="Concurrent Fragments" hint="Parallel fragment downloads">
            <NumberInput id="input-concurrent" value={cfg.concurrentFragments} onChange={set('concurrentFragments')} min={1} max={16} />
          </Field>
          <Field label="Cookies File">
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
      <Section title="Advanced" icon={Zap}>
        <Field label="Extra Arguments" hint="Appended verbatim to the yt-dlp command">
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
          <p className="text-xs text-surface-500 mb-1 uppercase tracking-wider font-medium">Command Preview</p>
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
          <Play size={18} /> Start Download
        </button>
        <button
          id="btn-preview-cmd"
          onClick={handlePreview}
          disabled={!cfg.url.trim()}
          className="btn-secondary py-3 px-4 disabled:opacity-40"
          title="Preview command"
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
}
