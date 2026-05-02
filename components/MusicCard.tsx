'use client';

import Link from 'next/link';

export default function MusicCard({ song }: { song: any }) {
  const waveHeights = [12, 16, 10, 18, 8];

  return (
    <Link href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="music-card">
        <div className="music-cover" style={song.coverUrl ? { backgroundImage: `url(${song.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          {!song.coverUrl && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          )}
        </div>
        <div className="music-title">{song.title}</div>
        <div className="music-artist">{song.artist}</div>
        <div className="music-play-row">
          <button className="play-btn" style={{ pointerEvents: 'none' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <div className="mini-waveform">
            {waveHeights.map((h, i) => (
               <div key={i} className="wave-bar" style={{ height: `${h}px` }} />
            ))}
          </div>
          <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>Play</span>
        </div>
      </div>
    </Link>
  );
}
