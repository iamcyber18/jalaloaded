'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMusicPlayer } from './MusicPlayerContext';

export default function MusicCard({ song }: { song: any }) {
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  const waveHeights = [12, 16, 10, 18, 8];
  const isThisPlaying = currentTrack?._id === song._id && isPlaying;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack(song);
  };

  return (
    <Link href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="music-card">
        <div className="music-cover" style={{ position: 'relative', overflow: 'hidden' }}>
          {song.coverUrl ? (
            <Image 
              src={song.coverUrl} 
              alt={song.title} 
              fill 
              sizes="(max-width: 768px) 50vw, 20vw" 
              style={{ objectFit: 'cover' }} 
            />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          )}
        </div>
        <div className="music-title">{song.title}</div>
        <div className="music-artist">{song.artist}</div>
        <div className="music-play-row">
          <button 
            type="button" 
            className="play-btn" 
            onClick={handlePlayClick}
            style={{ 
              background: isThisPlaying ? '#FF6B00' : 'rgba(255,107,0,0.15)',
              border: isThisPlaying ? 'none' : '1px solid rgba(255,107,0,0.3)',
              cursor: 'pointer' 
            }}
          >
            {isThisPlaying ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF6B00"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          <div className="mini-waveform">
            {waveHeights.map((h, i) => (
              <div key={i} className={`wave-bar ${isThisPlaying ? 'active' : ''}`} style={{ height: `${h}px` }} />
            ))}
          </div>
          <span style={{ fontSize: '9px', color: isThisPlaying ? '#FF6B00' : 'var(--color-text-tertiary)' }}>
            {isThisPlaying ? 'Playing' : 'Play'}
          </span>
        </div>
      </div>
    </Link>
  );
}

