'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  src: string;
  title: string;
  artist: string;
  coverUrl?: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ src, title, artist, coverUrl, autoPlay }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [autoPlay]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px', padding: '16px', marginTop: '24px'
    }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
      />

      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
        {/* Mini cover */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
          background: coverUrl ? `url(${coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: playing ? '0 0 20px rgba(255,107,0,0.2)' : 'none',
          transition: 'box-shadow 0.3s'
        }}>
          {!coverUrl && <span style={{ fontSize: '20px' }}>🎵</span>}
        </div>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{artist}</div>
        </div>

        {/* Play/Pause */}
        <button onClick={toggle} style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: playing ? 'rgba(255,107,0,0.15)' : 'linear-gradient(135deg, #FF6B00, #ff8533)',
          border: playing ? '2px solid #FF6B00' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
        }}>
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF6B00"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div onClick={seek} style={{
        width: '100%', height: '6px', borderRadius: '3px',
        background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
        position: 'relative', marginBottom: '8px'
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: '3px',
          background: 'linear-gradient(90deg, #FF6B00, #ff8533)',
          transition: 'width 0.1s linear'
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
          width: '12px', height: '12px', borderRadius: '50%',
          background: '#FF6B00', border: '2px solid #fff',
          boxShadow: '0 0 6px rgba(255,107,0,0.4)',
          display: pct > 0 ? 'block' : 'none'
        }} />
      </div>

      {/* Time + Volume */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: '"DM Sans", monospace' }}>
          {fmt(currentTime)} / {fmt(duration)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
          <input
            type="range" min="0" max="1" step="0.01" value={volume}
            onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
            style={{ width: '60px', accentColor: '#FF6B00', height: '3px' }}
          />
        </div>
      </div>
    </div>
  );
}
