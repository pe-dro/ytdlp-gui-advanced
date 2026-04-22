import { useState } from 'react';
import { Globe, Search, ExternalLink } from 'lucide-react';
import Popover from './Popover';
import { useI18n } from '../i18n/index';

const SITES = [
  { name: 'YouTube',       url: 'youtube.com',       emoji: '🎬' },
  { name: 'Vimeo',         url: 'vimeo.com',         emoji: '🎥' },
  { name: 'Twitter / X',   url: 'x.com',             emoji: '🐦' },
  { name: 'Instagram',     url: 'instagram.com',     emoji: '📸' },
  { name: 'TikTok',        url: 'tiktok.com',        emoji: '🎵' },
  { name: 'Facebook',      url: 'facebook.com',      emoji: '👤' },
  { name: 'Reddit',        url: 'reddit.com',        emoji: '🤖' },
  { name: 'Twitch',        url: 'twitch.tv',         emoji: '🎮' },
  { name: 'SoundCloud',    url: 'soundcloud.com',    emoji: '🎧' },
  { name: 'Spotify',       url: 'spotify.com',       emoji: '💚' },
  { name: 'Dailymotion',   url: 'dailymotion.com',   emoji: '📺' },
  { name: 'Bilibili',      url: 'bilibili.com',      emoji: '📱' },
  { name: 'Rumble',        url: 'rumble.com',        emoji: '📡' },
  { name: 'Crunchyroll',   url: 'crunchyroll.com',   emoji: '🍥' },
  { name: 'Bandcamp',      url: 'bandcamp.com',      emoji: '🎸' },
  { name: 'Mixcloud',      url: 'mixcloud.com',      emoji: '🎛️' },
  { name: 'Kick',          url: 'kick.com',          emoji: '🟢' },
  { name: 'Odysee',        url: 'odysee.com',        emoji: '🌊' },
  { name: 'PeerTube',      url: 'peertube.tv',       emoji: '🔗' },
  { name: 'Niconico',      url: 'nicovideo.jp',      emoji: '🇯🇵' },
  { name: 'Bitchute',      url: 'bitchute.com',      emoji: '📻' },
  { name: 'VK',            url: 'vk.com',            emoji: '🔵' },
  { name: 'Streamable',    url: 'streamable.com',    emoji: '▶️' },
  { name: 'Nebula',        url: 'nebula.tv',         emoji: '🌌' },
  { name: 'Floatplane',    url: 'floatplane.com',    emoji: '✈️' },
  { name: 'Arte',          url: 'arte.tv',           emoji: '🎨' },
  { name: 'BBC iPlayer',   url: 'bbc.co.uk/iplayer', emoji: '📺' },
  { name: 'CNN',           url: 'cnn.com',           emoji: '📰' },
  { name: 'ESPN',          url: 'espn.com',          emoji: '⚽' },
  { name: 'Pornhub',       url: 'pornhub.com',       emoji: '🔞' },
];

export default function SupportedSites({ className }) {
  const [search, setSearch] = useState('');
  const { t } = useI18n();

  const filtered = SITES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.url.toLowerCase().includes(search.toLowerCase())
  );

  const content = (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sites..."
          className="w-full bg-surface-800/60 border border-surface-700/40 rounded-lg py-1.5 pl-7 pr-3 text-xs text-surface-200 placeholder:text-surface-600 outline-none focus:border-accent-600/50"
        />
      </div>

      {/* List */}
      <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
        {filtered.map(site => (
          <div key={site.url} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-700/30 transition-colors">
            <span className="text-sm">{site.emoji}</span>
            <span className="text-xs text-surface-200 font-medium flex-1">{site.name}</span>
            <span className="text-[10px] text-surface-500 font-mono">{site.url}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-surface-500 text-xs py-3">No results</p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-surface-700/40 pt-2 flex items-center justify-between text-[10px] text-surface-500">
        <span>1800+ sites supported by yt-dlp</span>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.electronAPI?.openPath?.('https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md'); }}
          className="flex items-center gap-1 text-accent-400 hover:text-accent-300 transition-colors"
        >
          Full list <ExternalLink size={9} />
        </a>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      title="Supported Sites"
      icon={Globe}
      iconSize={15}
      className={className}
    />
  );
}
