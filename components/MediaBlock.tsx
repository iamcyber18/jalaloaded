'use client';

import { useState } from 'react';
import { IMediaItem } from '@/models/Post';

export default function MediaBlock({ mediaItems }: { mediaItems: IMediaItem[] }) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!mediaItems || mediaItems.length === 0) return null;

  // Split media by type
  const photos = mediaItems.filter(m => m.type === 'photo').sort((a,b) => a.order - b.order);
  const videos = mediaItems.filter(m => m.type === 'video').sort((a,b) => a.order - b.order);

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <>
      {/* Photos Section */}
      {photos.length > 0 && (
        <div className="photo-section">
          <div className="photo-grid-3">
            {photos.slice(0, 3).map((photo, index) => (
              <div 
                key={index} 
                className="photo-slot"
                onClick={() => setLightboxImage(photo.url)}
              >
                <div className="photo-bg" style={{ background: `url(${photo.url}) center/cover`, height: '100%' }}>
                   {!photo.url && <div className="photo-label">IMG</div>}
                   {photos.length > 3 && index === 2 && (
                     <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '24px', fontFamily: '"Bebas Neue", sans-serif' }}>
                       +{photos.length - 3}
                     </div>
                   )}
                </div>
                <div className="photo-overlay"><div className="photo-expand"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></div></div>
              </div>
            ))}
          </div>
          {photos[0]?.caption && <div className="photo-caption">{photos[0].caption}</div>}
        </div>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <div style={{ padding: '0 28px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {videos.map((video, idx) => {
            if (video.source === 'youtube') {
              const ytId = getYouTubeId(video.url);
              return ytId ? (
                <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : null;
            } else {
              return (
                <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <video 
                    src={video.url} 
                    controls 
                    style={{ width: '100%', height: '100%' }}
                    poster={video.thumbnailUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {video.caption && <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginTop: '8px' }}>{video.caption}</p>}
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Lightbox Modal (unchanged tailwind, just for expanding) */}
      {lightboxImage && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', cursor: 'zoom-out' }}
          onClick={() => setLightboxImage(null)}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', height: '80vh' }}>
            <button style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img 
              src={lightboxImage} 
              alt="Expanded image" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
