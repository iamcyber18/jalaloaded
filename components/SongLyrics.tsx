'use client';

import { useState } from 'react';

export default function SongLyrics({ lyrics, songTitle, artist }: { lyrics: string; songTitle: string; artist: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!lyrics || !lyrics.trim()) return null;

  const lines = lyrics.trim().split('\n');
  const isLong = lines.length > 25;
  const displayedLyrics = expanded || !isLong ? lyrics : lines.slice(0, 25).join('\n') + '\n...';

  const handleCopy = () => {
    navigator.clipboard.writeText(`${songTitle} by ${artist} Lyrics:\n\n${lyrics}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      maxWidth: '800px', margin: '32px auto 0', padding: '0 24px',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, rgba(26,26,26,0.9) 0%, rgba(18,18,18,0.95) 100%)',
        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
        padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', filter: 'drop-shadow(0 0 8px rgba(255,107,0,0.4))' }}>📜</span>
            <div>
              <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Song Lyrics
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {songTitle} — {artist}
              </div>
            </div>
          </div>

          <button
            onClick={handleCopy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px',
              background: copied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 107, 0, 0.1)',
              border: copied ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255, 107, 0, 0.25)',
              color: copied ? '#4ade80' : '#FF6B00',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: '"Syne", sans-serif'
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy Lyrics
              </>
            )}
          </button>
        </div>

        {/* Lyrics Body */}
        <div style={{
          fontSize: '14px', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)',
          whiteSpace: 'pre-line', fontFamily: '"DM Sans", sans-serif',
          background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.04)'
        }}>
          {displayedLyrics}
        </div>

        {/* Read More / Collapse Toggle */}
        {isLong && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'transparent', border: 'none',
                color: '#FF6B00', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', fontFamily: '"Syne", sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              {expanded ? (
                <>Collapse Lyrics ▲</>
              ) : (
                <>Show Full Lyrics ({lines.length} lines) ▼</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
