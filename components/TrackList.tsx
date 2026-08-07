'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { Music, Video, Star, Heart, Play, Download } from 'lucide-react';

interface TrackListProps {
  songs: any[];
  initialLimit?: number;
  genreColors: Record<string, string>;
  children?: React.ReactNode;
}

export default function TrackList({ songs, initialLimit = 12, genreColors }: TrackListProps) {
  const [visibleCount, setVisibleCount] = useState(initialLimit);

  const visibleSongs = songs.slice(0, visibleCount);
  const hasMore = visibleCount < songs.length;

  return (
    <>
      {visibleSongs.map((song: any, i: number) => {
        const gc = genreColors[song.genre] || '#888';
        return (
          <div key={song._id.toString()} className="music-track-row" style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 16px', borderRadius: '14px', marginBottom: '6px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            animationDelay: `${Math.min(i * 0.06, 1.2)}s`,
          }}>
            {/* Cover Art */}
            <Link href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div className="music-track-cover" style={{
                width: '54px', height: '54px', borderRadius: '12px', overflow: 'hidden',
                background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : `linear-gradient(135deg, ${gc}33, ${gc}11)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                boxShadow: `0 2px 10px ${gc}22`
              }}>
                {!song.coverUrl && <Music size={20} style={{ opacity: 0.5, color: '#fff' }} />}
              </div>
            </Link>

            {/* Song Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none', color: '#fff' }}>
                <div className="music-track-title" style={{
                  fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', cursor: 'pointer', fontFamily: '"Syne", sans-serif',
                  display: 'flex', alignItems: 'center'
                }}>
                  {song.title}
                  {song.videoUrl && (
                    <span style={{
                      marginLeft: '8px', padding: '2px 6px', borderRadius: '4px',
                      background: 'rgba(230,57,70,0.15)', color: '#ff4d5e', fontSize: '8px',
                      fontWeight: 800, border: '1px solid rgba(230,57,70,0.3)', verticalAlign: 'middle',
                      display: 'inline-flex', alignItems: 'center', gap: '3px'
                    }}>
                      <Video size={9} /> VIDEO
                    </span>
                  )}
                  {song.featured && <Star size={11} fill="#FFD700" color="#FFD700" style={{ marginLeft: '8px' }} />}
                </div>
              </Link>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <Link href={`/music/artist/${song.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} style={{ color: '#FF6B00', textDecoration: 'none', fontWeight: 700 }}>{song.artist}</Link>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
                <span>{song.year || new Date(song.createdAt).getFullYear()}</span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
                <span>{formatNumber(song.plays || 0)} plays</span>
              </div>
              {song.description && (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', marginTop: '3px', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.description}
                </div>
              )}
            </div>

            {/* Genre Pill */}
            <div className="music-genre-pill" style={{
              padding: '3px 10px', borderRadius: '12px', fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.8px', textTransform: 'uppercase', flexShrink: 0,
              background: `${gc}15`, color: gc, border: `1px solid ${gc}25`,
            }}>
              {song.genre}
            </div>

            {/* Like count */}
            <div className="music-track-likes" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,255,255,0.15)" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {song.likes || 0}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
              {song.mediaUrl && (
                <Link href={`/music/${song.slug || song._id}`} title="Listen"
                  className="music-play-pulse"
                  style={{
                    width: '34px', height: '34px', borderRadius: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all 0.2s'
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </Link>
              )}
              {(song.downloadUrl || song.mediaUrl) && (
                <a href={`/api/songs/${song._id}/download`} title="Download"
                  style={{
                    width: '34px', height: '34px', borderRadius: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.15)',
                    color: '#FF6B00', transition: 'all 0.2s', textDecoration: 'none'
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
              )}
            </div>
          </div>
        );
      })}

      {/* See More / See Less */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => setVisibleCount(prev => prev + 12)}
            style={{
              padding: '12px 40px', borderRadius: '12px', border: '1px solid rgba(255,107,0,0.3)',
              background: 'rgba(255,107,0,0.08)', color: '#FF6B00', fontSize: '13px',
              fontWeight: 700, cursor: 'pointer', fontFamily: '"Syne", sans-serif',
              transition: 'all 0.2s', letterSpacing: '0.5px'
            }}
          >
            See More ({songs.length - visibleCount} remaining)
          </button>
        </div>
      )}
      {!hasMore && songs.length > initialLimit && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => setVisibleCount(initialLimit)}
            style={{
              padding: '10px 30px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.2s'
            }}
          >
            Show Less
          </button>
        </div>
      )}
    </>
  );
}
