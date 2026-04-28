'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import TrackAction from './TrackAction';

interface FeaturedSong {
  _id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  slug?: string;
  coverUrl?: string;
  mediaUrl?: string;
  downloadUrl?: string;
  streamUrl?: string;
  plays: number;
  downloads: number;
  likes: number;
  description?: string;
}

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export default function FeaturedCarousel({ songs }: { songs: FeaturedSong[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % songs.length);
  }, [songs.length]);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + songs.length) % songs.length);
  }, [songs.length]);

  // Auto-slide every 5s
  useEffect(() => {
    if (paused || songs.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, songs.length]);

  if (songs.length === 0) return null;
  const song = songs[current];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(255,107,0,0.12) 0%, rgba(0,0,0,0) 60%)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '40px 0 36px'
      }}
    >
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,107,0,0.08), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Cover Art */}
        <Link href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            width: '220px', height: '220px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,107,0,0.1)',
            background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: 'transform 0.4s', cursor: 'pointer'
          }}>
            {!song.coverUrl && (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent 50%)' }} />
          </div>
        </Link>

        {/* Song Info */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,215,0,0.1)', color: '#ffd700', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>⭐ Featured</span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600 }}>{song.genre}</span>
          </div>

          <Link href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none' }}>
            <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '32px', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 6px', cursor: 'pointer' }}>
              {song.title}
            </h2>
          </Link>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            {song.artist} • {song.year}
          </div>
          {song.description && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, marginBottom: '16px', maxWidth: '450px' }}>
              {song.description}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{formatNumber(song.plays || 0)}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plays</div>
            </div>
            <div>
              <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{formatNumber(song.downloads || 0)}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Downloads</div>
            </div>
            <div>
              <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{formatNumber(song.likes || 0)}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Likes</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {(song.downloadUrl || song.mediaUrl) && (
              <TrackAction songId={song._id} action="download" href={song.downloadUrl || song.mediaUrl} download
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #FF6B00, #ff8533)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </TrackAction>
            )}
            {song.streamUrl && (
              <TrackAction songId={song._id} action="play" href={song.streamUrl}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'rgba(29,190,115,0.1)', border: '1px solid rgba(29,190,115,0.2)', color: '#1DBE73', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Stream
              </TrackAction>
            )}
          </div>
        </div>
      </div>

      {/* Carousel controls */}
      {songs.length > 1 && (
        <div style={{ maxWidth: '1100px', margin: '16px auto 0', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={prev} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            {songs.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? '24px' : '8px', height: '8px', borderRadius: '4px',
                  background: i === current ? '#FF6B00' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
          <button onClick={next} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginLeft: '4px' }}>{current + 1} / {songs.length}</div>
        </div>
      )}
    </div>
  );
}
