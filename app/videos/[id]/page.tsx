import dbConnect from '@/lib/mongodb';
import Video from '@/models/Video';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import TrackAction from '@/components/TrackAction';

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
  
  // Extract YouTube ID if it's a YouTube link
  let youtubeId = '';
  if (isYouTube) {
    const match = video.mediaUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    youtubeId = match ? match[1] : '';
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
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} 
              title={video.title} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0 }}
            ></iframe>
          ) : (
            <video 
              controls 
              autoPlay 
              poster={video.thumbnailUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            >
              <source src={video.mediaUrl} type="video/mp4" />
              Your browser does not support HTML video.
            </video>
          )}
        </div>

        {/* Video Info */}
        <div style={{ background: 'var(--color-background-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border-tertiary)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {video.category && (
               <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,107,0,0.1)', color: 'var(--orange)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{video.category}</span>
            )}
            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-secondary)', fontSize: '11px', fontWeight: 600 }}>
               {new Date(video.createdAt).toLocaleDateString()}
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

            <TrackAction action="like" href="#" songId={video._id.toString()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border-tertiary)', borderRadius: '20px', color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
               Like ({video.likes || 0})
            </TrackAction>
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
