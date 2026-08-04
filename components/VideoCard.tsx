import Link from 'next/link';

export default function VideoCard({ video }: { video: any }) {
  // Format duration if it exists (assuming it's in seconds)
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Generate thumbnail URL for various video platforms if no custom thumbnail
  const getThumbnailUrl = () => {
    if (video.thumbnailUrl) {
      return video.thumbnailUrl;
    }
    
    // Check if it's a YouTube video and generate thumbnail
    const isYouTube = video.mediaUrl?.includes('youtube.com') || video.mediaUrl?.includes('youtu.be');
    if (isYouTube) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
        /m\.youtube\.com\/watch\?v=([^&\n?#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = video.mediaUrl.match(pattern);
        if (match && match[1]) {
          // Try maxresdefault first, fallback to hqdefault if needed
          return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
        }
      }
    }
    
    // For Facebook videos, we can't easily get thumbnails via URL
    // For TikTok videos, thumbnails are also not easily accessible
    // These would need custom thumbnail uploads or API integration
    
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();
  const isOfficialVideo = video.isSongVideo || video.category === 'Music Videos' || /official\s+video/i.test(video.title || '');

  return (
    <Link href={`/videos/${video.slug || video._id}`} className="video-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div className="vid-thumb" style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' } : { position: 'relative' }}>
        
        {/* Category / Official Video Badge */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2 }}>
          {isOfficialVideo ? (
            <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'linear-gradient(135deg, #e63946, #c1121f)', color: '#fff', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
              🎬 OFFICIAL VIDEO
            </span>
          ) : video.category && video.category !== 'All' ? (
            <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.7)', color: '#FF6B00', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
              {video.category}
            </span>
          ) : null}
        </div>

        <div className="vid-play">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        {video.duration ? <div className="vid-dur">{formatDuration(video.duration)}</div> : null}
      </div>
      <div className="vid-title" style={{ marginTop: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{video.title}</div>
    </Link>
  );
}
