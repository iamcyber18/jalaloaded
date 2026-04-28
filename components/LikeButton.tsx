'use client';

import { useState } from 'react';

export default function LikeButton({ songId, initialLikes }: { songId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikes(l => l + 1);
    try {
      await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' }),
      });
    } catch {}
  };

  return (
    <button
      onClick={handleLike}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '11px 22px', borderRadius: '10px',
        background: liked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
        border: liked ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.08)',
        color: liked ? '#ef4444' : 'rgba(255,255,255,0.6)',
        fontSize: '12px', fontWeight: 600, cursor: liked ? 'default' : 'pointer',
        fontFamily: '"DM Sans", sans-serif', transition: 'all 0.2s'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : 'currentColor'} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {likes}
    </button>
  );
}
