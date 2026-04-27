'use client';

import { useState } from 'react';
import { formatNumber } from '@/lib/utils';

export default function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleLike = async () => {
    if (liked) return; // prevent multiple likes per session

    setAnimating(true);
    setLiked(true);
    setLikes(prev => prev + 1);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
      }
    } catch (error) {
      // Revert on error
      setLiked(false);
      setLikes(prev => prev - 1);
    }

    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <button
      className={`share-btn ${liked ? 'liked' : ''}`}
      onClick={handleLike}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill={liked ? '#FF6B00' : 'none'}
        stroke={liked ? '#FF6B00' : 'currentColor'}
        strokeWidth="2"
        style={{
          transition: 'all 0.3s ease',
          transform: animating ? 'scale(1.3)' : 'scale(1)',
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{formatNumber(likes)}</span>
      {animating && (
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '18px',
          animation: 'likeFloat 0.6s ease-out forwards',
          pointerEvents: 'none',
        }}>
          ❤️
        </span>
      )}
    </button>
  );
}
