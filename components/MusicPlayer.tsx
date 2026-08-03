'use client';

import { useMusicPlayer } from './MusicPlayerContext';
import Image from 'next/image';
import { formatDuration } from '@/lib/utils';

export default function MusicPlayer() {
  const { 
    currentTrack, isPlaying, progress, duration, currentTime, isShuffle, isRepeat, volume,
    togglePlay, nextTrack, prevTrack, seekTrack, toggleShuffle, toggleRepeat, setVolume, closePlayer 
  } = useMusicPlayer();

  if (!currentTrack) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      background: 'rgba(13, 13, 13, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(255, 107, 0, 0.2)',
      boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      {/* Track Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', maxWidth: '30%' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #FF6B00, #c84b00)',
          boxShadow: isPlaying ? '0 0 16px rgba(255,107,0,0.35)' : 'none'
        }}>
          {currentTrack.coverUrl ? (
            <Image 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title} 
              fill 
              sizes="46px"
              style={{ objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🎵
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'var(--font-syne, sans-serif)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentTrack.title}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '2px'
          }}>
            {currentTrack.artist}
          </div>
        </div>
      </div>

      {/* Controls & Progress */}
      <div style={{ flex: 1, maxWidth: '580px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            type="button"
            onClick={toggleShuffle} 
            title="Shuffle"
            style={{ background: 'none', border: 'none', color: isShuffle ? '#FF6B00' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
          </button>

          <button 
            type="button"
            onClick={prevTrack} 
            title="Previous"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>

          <button 
            type="button"
            onClick={togglePlay} 
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B00, #ff8533)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
              color: '#fff'
            }}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>

          <button 
            type="button"
            onClick={nextTrack} 
            title="Next"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>

          <button 
            type="button"
            onClick={toggleRepeat} 
            title="Repeat"
            style={{ background: 'none', border: 'none', color: isRepeat ? '#FF6B00' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          </button>
        </div>

        {/* Progress Bar & Timers */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', minWidth: '32px', textAlign: 'right', fontFamily: 'monospace' }}>
            {formatDuration(currentTime)}
          </span>
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = ((e.clientX - rect.left) / rect.width) * 100;
              seekTrack(Math.max(0, Math.min(100, pct)));
            }}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div 
              style={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: '2px',
                background: 'linear-gradient(90deg, #FF6B00, #ff8533)',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                right: '-4px',
                top: '-3px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 0 6px rgba(255,107,0,0.8)'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', minWidth: '32px', fontFamily: 'monospace' }}>
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Close */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '160px', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: '64px', accentColor: '#FF6B00', cursor: 'pointer' }}
          />
        </div>

        <button 
          type="button"
          onClick={closePlayer} 
          title="Close player"
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

