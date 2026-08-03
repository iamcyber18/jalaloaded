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

  // Auto-slide every 4s
  useEffect(() => {
    if (paused || songs.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [paused, next, songs.length]);

  if (songs.length === 0) return null;
  const song = songs[current];

  return (
    <div
      className="music-featured-hero"
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(255,107,0,0.1) 0%, rgba(13,13,13,0.95) 40%, rgba(99,88,255,0.05) 100%)',
        borderBottom: '1px solid rgba(255,107,0,0.15)',
        padding: '48px 0 40px'
      }}
    >
      {/* Ambient glow orbs */}
      <div className="music-ambient-orb" style={{ position: 'absolute', top: '-30%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,107,0,0.12), transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
      <div className="music-ambient-orb" style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,88,255,0.06), transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', animationDelay: '3s' }} />

      {/* Subtle grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '36px', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {/* Cover Art with hover tilt */}
        <Link href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none' }}>
          <div className="music-featured-cover" style={{
            width: '240px', height: '240px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,107,0,0.12)',
            background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            {!song.coverUrl && (
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent 50%)' }} />
            {/* Floating play icon */}
            <div className="music-play-pulse" style={{
              position: 'absolute', bottom: '14px', right: '14px',
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B00, #ff8533)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255,107,0,0.5)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            </div>
          </div>
        </Link>

        {/* Song Info */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
              color: '#ffd700', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '1.2px', border: '1px solid rgba(255,215,0,0.2)',
              boxShadow: '0 0 12px rgba(255,215,0,0.1)'
            }}>
              ⭐ Featured
            </span>
            <span className="music-genre-pill" style={{
              padding: '4px 12px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
              fontSize: '10px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)'
            }}>
              {song.genre}
            </span>
          </div>

          <Link href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none' }}>
            <h2 style={{
              fontFamily: '"Syne", sans-serif', fontSize: '34px', fontWeight: 800,
              color: '#fff', lineHeight: 1.15, margin: '0 0 8px', cursor: 'pointer',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              letterSpacing: '-0.5px'
            }}>
              {song.title}
            </h2>
          </Link>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', fontWeight: 500 }}>
            <span style={{ color: '#FF6B00', fontWeight: 700 }}>{song.artist}</span>
            <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.15)' }}>•</span>
            {song.year}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '28px', marginBottom: '24px' }}>
            {[
              { value: formatNumber(song.plays || 0), label: 'Plays' },
              { value: formatNumber(song.downloads || 0), label: 'Downloads' },
              { value: formatNumber(song.likes || 0), label: 'Likes' },
            ].map(stat => (
              <div key={stat.label} style={{ cursor: 'default' }}>
                <div className="music-stat-value" style={{
                  fontFamily: '"Bebas Neue", sans-serif', fontSize: '26px', color: '#FF6B00',
                  lineHeight: 1
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
                  letterSpacing: '1px', fontWeight: 600, marginTop: '2px'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {(song.downloadUrl || song.mediaUrl) && (
              <TrackAction songId={song._id} action="download" href={song.downloadUrl || song.mediaUrl} download
                className="music-action-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '11px 22px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF6B00, #ff8533)', color: '#fff',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  border: 'none', fontFamily: '"Syne", sans-serif',
                  letterSpacing: '0.5px'
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </TrackAction>
            )}
            {song.streamUrl && (
              <TrackAction songId={song._id} action="play" href={song.streamUrl}
                className="music-action-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '11px 22px', borderRadius: '12px',
                  background: 'rgba(29,190,115,0.1)', border: '1px solid rgba(29,190,115,0.25)',
                  color: '#1DBE73', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: '"Syne", sans-serif', letterSpacing: '0.5px'
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Stream
              </TrackAction>
            )}
          </div>
        </div>
      </div>

      {/* Carousel controls */}
      {songs.length > 1 && (
        <div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
          <button onClick={prev} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            {songs.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? '28px' : '8px', height: '8px', borderRadius: '4px',
                  background: i === current ? 'linear-gradient(90deg, #FF6B00, #ff8533)' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: i === current ? '0 0 10px rgba(255,107,0,0.4)' : 'none'
                }}
              />
            ))}
          </div>
          <button onClick={next} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginLeft: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>
            {current + 1} / {songs.length}
          </div>
        </div>
      )}
    </div>
  );
}
