'use client';

import { useMusicPlayer } from '@/components/MusicPlayerContext';

export default function MusicCard({ song }: { song: any }) {
  const { playTrack } = useMusicPlayer();
  const waveHeights = [12, 16, 10, 18, 8];

  return (
    <div className="music-card" onClick={() => playTrack(song)}>
      <div className="music-cover" style={song.coverArtUrl ? { backgroundImage: `url(${song.coverArtUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        {!song.coverArtUrl && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        )}
      </div>
      <div className="music-title">{song.title}</div>
      <div className="music-artist">{song.artist}</div>
      <div className="music-play-row">
        <button className="play-btn">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <div className="mini-waveform">
          {waveHeights.map((h, i) => (
             <div key={i} className="wave-bar" style={{ height: `${h}px` }} />
          ))}
        </div>
        <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>3:24</span>
      </div>
    </div>
  );
}
