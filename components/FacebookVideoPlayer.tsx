'use client';

import { useState, useEffect } from 'react';

interface FacebookVideoPlayerProps {
  videoUrl: string;
  title: string;
}

export default function FacebookVideoPlayer({ videoUrl, title }: FacebookVideoPlayerProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to show fallback if iframe doesn't load
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowFallback(true);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setShowFallback(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setShowFallback(true);
  };

  if (showFallback) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexDirection: 'column', 
        gap: '16px',
        background: '#1877F2',
        color: '#fff'
      }}>
        <div style={{ fontSize: '24px' }}>📘</div>
        <p style={{ fontSize: '16px', fontWeight: 600 }}>Facebook Video</p>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            padding: '12px 24px', 
            background: '#fff', 
            color: '#1877F2', 
            textDecoration: 'none', 
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#fff';
          }}
        >
          Watch on Facebook
        </a>
        <p style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center', maxWidth: '300px' }}>
          This Facebook video cannot be embedded directly. Click the button above to watch on Facebook.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#1877F2',
          color: '#fff',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📘</div>
            <p>Loading Facebook video...</p>
          </div>
        </div>
      )}
      
      <iframe 
        width="100%" 
        height="100%" 
        src={`https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(videoUrl)}&show_text=false&width=560&t=0`}
        title={title} 
        frameBorder="0" 
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}