import Link from 'next/link';
import { getAuthorDisplay } from '@/lib/authors';
import { timeAgo } from '@/lib/utils';

export default function PostCard({ post }: { post: any }) {
  const photoMedia = post.media?.find((m: any) => m.type === 'photo');
  const thumbUrl = photoMedia?.url || '';
  const photoCount = post.media?.filter((m: any) => m.type === 'photo').length || 0;
  const author = getAuthorDisplay(post.author || 'jalal');

  return (
    <Link href={`/blog/${post.slug}`} className="post-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div className="post-thumb">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={post.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '50px', color: 'rgba(255,107,0,0.08)', letterSpacing: '2px' }}>
            JL
          </div>
        )}
        <div className="post-cat-badge">{post.category}</div>
        {photoCount > 1 && (
          <div className="post-img-count">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
            {photoCount}
          </div>
        )}
      </div>
      <div className="post-body">
        <div className="post-title">{post.title}</div>
        <div className="post-time">{timeAgo(post.createdAt || Date.now())}</div>
        <div className="post-footer" style={{ marginTop: '8px' }}>
          <div className="post-author">
            <div className="post-av" style={{ background: '#FF6B00', color: '#fff' }}>{author.initials}</div>
            <span className="post-av-name">{author.name}</span>
          </div>
          <div className="post-stats">
            <div className="post-stat">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {Math.floor(Math.random() * 5 + 1)}k
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
