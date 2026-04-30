import Link from 'next/link';

export default function VideoCard({ video }: { video: any }) {
  // Format duration if it exists (assuming it's in seconds)
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Link href={`/videos/${video.slug || video._id}`} className="video-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div className="vid-thumb" style={video.thumbnailUrl ? { backgroundImage: `url(${video.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        <div className="vid-play">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        {video.duration && <div className="vid-dur">{formatDuration(video.duration)}</div>}
      </div>
      <div className="vid-title">{video.title}</div>
    </Link>
  );
}
