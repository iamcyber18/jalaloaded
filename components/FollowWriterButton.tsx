'use client';

import { useState, useEffect } from 'react';

export default function FollowWriterButton({ authorId, authorName }: { authorId: string; authorName: string }) {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const followed = localStorage.getItem(`followed_${authorId}`);
      if (followed === 'true') {
        setIsFollowing(true);
      }
    }
  }, [authorId]);

  const toggleFollow = () => {
    setIsFollowing((prev) => {
      const newState = !prev;
      if (newState) {
        localStorage.setItem(`followed_${authorId}`, 'true');
      } else {
        localStorage.removeItem(`followed_${authorId}`);
      }
      return newState;
    });
  };

  return (
    <button 
      className="bio-follow" 
      onClick={toggleFollow}
      style={isFollowing ? {
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--color-text-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s'
      } : {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}
    >
      {isFollowing ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Following
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Follow {authorName}
        </>
      )}
    </button>
  );
}
