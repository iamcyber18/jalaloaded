'use client';

import { useState } from 'react';

export default function LikeButton({ songId, postId, videoId, initialLikes }: { songId?: string; postId?: string; videoId?: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikes(l => l + 1);
    
    const id = songId || postId || videoId;
    if (!id) return;

    try {
      if (songId) {
        await fetch(`/api/songs/${songId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'like' }),
        });
      } else if (postId) {
        await fetch(`/api/posts/${postId}/like`, {
          method: 'POST',
        });
      } else if (videoId) {
        await fetch(`/api/videos/${videoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'like' }),
        });
      }
    } catch {}
  };

  return (
    <button
      onClick={handleLike}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '20px',
        background: liked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
        border: liked ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--color-border-tertiary)',
        color: liked ? '#ef4444' : 'var(--color-text-primary)',
        fontSize: '13px', fontWeight: 600, cursor: liked ? 'default' : 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : 'currentColor'} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {likes}
    </button>
  );
}
