import dbConnect from '@/lib/mongodb';
import Video from '@/models/Video';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';
import { timeAgo } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  await dbConnect();

  try {
    const video = await Video.findById(id).lean();
    if (!video) return { title: 'Video Not Found' };

    return {
      title: `${video.title} - Jalaloaded TV`,
      description: video.description || `Watch ${video.title} on Jalaloaded TV.`,
      openGraph: {
        title: video.title,
        description: video.description || `Watch ${video.title} on Jalaloaded TV.`,
        type: 'video.other',
        ...(video.thumbnailUrl ? { images: [{ url: video.thumbnailUrl }] } : {}),
      },
    };
  } catch {
    return { title: 'Video' };
  }
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbConnect();
  
  let video;
  try {
    // We increment view count client-side or on API fetch to avoid double counting,
    // but doing it here is also fine for simple SSR tracking. Let's do it here.
    video = await Video.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
  } catch {
    notFound();
  }

  if (!video) notFound();

  const isYouTube = video.mediaUrl.includes('youtube.com') || video.mediaUrl.includes('youtu.be');
  const isFacebook = video.mediaUrl.includes('facebook.com') || video.mediaUrl.includes('fb.watch');
  const isTikTok = video.mediaUrl.includes('tiktok.com');
  const isVimeo = video.mediaUrl.includes('vimeo.com');
  
  // Extract YouTube ID if it's a YouTube link
  let youtubeId = '';
  if (isYouTube) {
    // Handle various YouTube URL formats including shorts
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
      /m\.youtube\.com\/watch\?v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = video.mediaUrl.match(pattern);
      if (match && match[1]) {
        youtubeId = match[1];
        break;
      }
    }
  }

  // Extract Facebook video ID
  let facebookVideoId = '';
  if (isFacebook) {
    // Handle various Facebook video URL formats
    const patterns = [
      /facebook\.com\/.*\/videos\/(\d+)/,
      /facebook\.com\/watch\/?\?v=(\d+)/,
      /fb\.watch\/([^/?]+)/,
      /facebook\.com\/.*\/posts\/(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = video.mediaUrl.match(pattern);
      if (match && match[1]) {
        facebookVideoId = match[1];
        break;
      }
    }
  }

  // Extract TikTok video ID
  let tikTokVideoId = '';
  if (isTikTok) {
    // Handle TikTok URL formats
    const patterns = [
      /tiktok\.com\/@[^/]+\/video\/(\d+)/,
      /tiktok\.com\/.*\/video\/(\d+)/,
      /vm\.tiktok\.com\/([^/?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = video.mediaUrl.match(pattern);
      if (match && match[1]) {
        tikTokVideoId = match[1];
        break;
      }
    }
  }

  // Check if it's a Vimeo video
  let vimeoId = '';
  if (isVimeo) {
    const match = video.mediaUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    vimeoId = match ? match[1] : '';
  }

  // Find some related videos
  const relatedVideos = await Video.find({ _id: { $ne: video._id }, category: video.category || 'All' })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  return (
    <div className="jlh min-h-screen">
      <div className="page" style={{ gridTemplateColumns: '1fr', maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        
        <Link href="/videos" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--orange)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Videos
        </Link>

        {/* Video Player */}
        <div style={{ width: '100%', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', position: 'relative', aspectRatio: '16/9', border: '1px solid var(--color-border-tertiary)' }}>
          {isYouTube && youtubeId ? (
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&autoplay=0&controls=1`} 
              title={video.title} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0 }}
              loading="lazy"
            ></iframe>
          ) : isFacebook && facebookVideoId ? (
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(video.mediaUrl)}&show_text=false&width=560&t=0`}
              title={video.title} 
              frameBorder="0" 
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0 }}
              loading="lazy"
            ></iframe>
          ) : isTikTok ? (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexDirection: 'column', 
              gap: '16px',
              background: '#000',
              color: '#fff'
            }}>
              <div style={{ fontSize: '24px' }}>🎵</div>
              <p>TikTok Video</p>
              <a 
                href={video.mediaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  padding: '12px 24px', 
                  background: '#ff0050', 
                  color: '#fff', 
                  textDecoration: 'none', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Watch on TikTok
              </a>
              <p style={{ fontSize: '12px', opacity: 0.6, textAlign: 'center', maxWidth: '300px' }}>
                TikTok videos cannot be embedded directly. Click the button above to watch on TikTok.
              </p>
            </div>
          ) : isVimeo && vimeoId ? (
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=0`} 
              title={video.title} 
              frameBorder="0" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0 }}
              loading="lazy"
            ></iframe>
          ) : video.mediaUrl ? (
            <video 
              controls 
              poster={video.thumbnailUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              preload="metadata"
              controlsList="nodownload"
            >
              <source src={video.mediaUrl} type="video/mp4" />
              <source src={video.mediaUrl} type="video/webm" />
              <source src={video.mediaUrl} type="video/ogg" />
              Your browser does not support HTML video.
            </video>
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexDirection: 'column', 
              gap: '16px',
              color: 'var(--color-text-secondary)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <p>Video not available</p>
              <p style={{ fontSize: '12px', opacity: 0.6 }}>Please check the video URL</p>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div style={{ background: 'var(--color-background-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border-tertiary)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {video.category && (
               <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,107,0,0.1)', color: 'var(--orange)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{video.category}</span>
            )}
            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-secondary)', fontSize: '11px', fontWeight: 600 }}>
               {timeAgo(video.createdAt)}
            </span>
          </div>

          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: '16px' }}>
            {video.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-tertiary)', paddingTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {video.views || 0} Views
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LikeButton videoId={video._id.toString()} initialLikes={video.likes || 0} />
              <ShareButton title={`${video.title} - Jalaloaded TV`} />
            </div>
          </div>

          {video.description && (
            <div style={{ marginTop: '24px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {video.description}
            </div>
          )}
        </div>

        {/* Related Videos */}
        {relatedVideos.length > 0 && (
          <div>
            <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: '20px', fontWeight: 800, marginBottom: '20px', borderBottom: '2px solid var(--orange)', display: 'inline-block', paddingBottom: '4px' }}>Up Next</h3>
            <div className="video-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {relatedVideos.map((rv: any) => (
                <Link href={`/videos/${rv._id.toString()}`} key={rv._id.toString()} className="video-card" style={{ display: 'block', textDecoration: 'none' }}>
                  <div className="vid-thumb" style={rv.thumbnailUrl ? { backgroundImage: `url(${rv.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                    <div className="vid-play">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                  <div className="vid-title">{rv.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
