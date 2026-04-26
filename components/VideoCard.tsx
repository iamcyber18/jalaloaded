import Link from 'next/link';

export default function VideoCard({ video }: { video: any }) {
  return (
    <Link href="/videos" className="video-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div className="vid-thumb" style={video.thumbnailUrl ? { backgroundImage: `url(${video.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        <div className="vid-play">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div className="vid-dur">4:30</div>
      </div>
      <div className="vid-title">{video.title}</div>
    </Link>
  );
}
