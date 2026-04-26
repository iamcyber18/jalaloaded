import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import MediaBlock from '@/components/MediaBlock';
import CommentSection from '@/components/CommentSection';
import Link from 'next/link';

// Convert stored author key to a proper display name
function getAuthorDisplay(author: string): { name: string; initials: string } {
  if (author === 'co-friend') return { name: 'Co-friend', initials: 'CO' };
  const name = author.charAt(0).toUpperCase() + author.slice(1);
  return { name, initials: name.slice(0, 2).toUpperCase() };
}
import { timeAgo, calculateReadTime, formatNumber } from '@/lib/utils';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

async function getPost(slug: string) {
  await dbConnect();
  // Increment view and fetch
  const post = await Post.findOneAndUpdate(
    { slug, status: 'published' },
    { $inc: { views: 1 } },
    { returnDocument: 'after' }
  ).lean();

  if (!post) return null;

  // Get related posts (same category, excluding current)
  const related = await Post.find({
    category: post.category,
    _id: { $ne: post._id },
    status: 'published'
  }).sort({ createdAt: -1 }).limit(3).lean();

  return { 
    post: JSON.parse(JSON.stringify(post)), 
    related: JSON.parse(JSON.stringify(related)) 
  };
}

export default async function SinglePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const data = await getPost(resolvedParams.slug);
  
  if (!data) {
    notFound();
  }

  const { post, related } = data;

  return (
    <div className="jlh min-h-screen">
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link href="/" className="bc-link" style={{ textDecoration: 'none' }}>Home</Link>
        <span className="bc-sep">›</span>
        <Link href="/blog" className="bc-link" style={{ textDecoration: 'none' }}>Blog</Link>
        <span className="bc-sep">›</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{post.title}</span>
      </div>

      <div className="page" style={{ maxWidth: '100%', alignItems: 'start' }}>
        {/* ARTICLE */}
        <div style={{ minWidth: 0 }}>
          <div className="article">
            {/* HEADER */}
            <div className="article-header">
              <div className="post-cat">{post.category}</div>
              <div className="post-title">{post.title}</div>
              <div className="post-meta">
                <div className="author-chip">
                  <div className="av" style={{ background: 'var(--orange)' }}>{getAuthorDisplay(post.author).initials}</div>
                  <div className="av-info">
                    <div className="av-name">{getAuthorDisplay(post.author).name}</div>
                    <div className="av-role">Writer &bull; Jalaloaded</div>
                  </div>
                </div>
                <div className="meta-divider"></div>
                <div className="meta-item">
                  <div className="meta-label">Published</div>
                  <div className="meta-val">{new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="meta-divider"></div>
                <div className="meta-item">
                  <div className="meta-label">Read Time</div>
                  <div className="meta-val">{calculateReadTime(post.body)} min read</div>
                </div>
                <div className="meta-divider"></div>
                <div className="meta-item">
                  <div className="meta-label">Views</div>
                  <div className="meta-val">{formatNumber(post.views || 1)}</div>
                </div>
                <div className="share-row">
                  <button className="share-btn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span>{formatNumber(post.likes || 0)}</span>
                  </button>
                  <button className="share-btn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* MEDIA BLOCK */}
            <MediaBlock mediaItems={post.media || []} />

            {/* BODY */}
            <div className="article-body">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  blockquote: ({children}) => <div className="pull-quote"><p>{children}</p></div>,
                  p: ({children}) => <p>{children}</p>
                }}
              >
                {post.body}
              </ReactMarkdown>
            </div>

            {/* TAGS */}
            <div className="tags-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              {post.tags?.map((tag: string) => (
                <div key={tag} className="tag-pill">{tag}</div>
              ))}
            </div>

            {/* REACTION BAR */}
            <div className="reaction-bar">
              <div className="reactions">
                <button className="react-btn"><span className="react-emoji">🔥</span><span className="react-count">2.1k</span></button>
                <button className="react-btn"><span className="react-emoji">💯</span><span className="react-count">1.4k</span></button>
                <button className="react-btn"><span className="react-emoji">🎵</span><span className="react-count">983</span></button>
              </div>
              <div className="views-info">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>{formatNumber(post.views || 1)} views</span>
              </div>
            </div>

            {/* AUTHOR BIO */}
            <div className="author-bio">
              <div className="bio-av">{post.author.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="bio-name">{getAuthorDisplay(post.author).name} — Writer at Jalaloaded</div>
                <div className="bio-text">Passionately covering music, culture, street life, and everything in between.</div>
                <button className="bio-follow">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Follow {post.author}
                </button>
              </div>
            </div>

            {/* RELATED POSTS */}
            {related.length > 0 && (
              <div className="related">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '22px', height: '3px', background: 'var(--orange)', borderRadius: '2px' }}></div>Related Posts</div>
                  <Link href={`/blog?category=${post.category}`} style={{ fontSize: '11px', color: 'var(--orange)', cursor: 'pointer', textDecoration: 'none' }}>View all &rarr;</Link>
                </div>
                <div className="related-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)' }}>
                  {related.map((r: any) => (
                    <Link href={`/blog/${r.slug}`} key={r._id.toString()} className="rel-card" style={{ display: 'block', textDecoration: 'none' }}>
                      <div className="rel-thumb" style={r.media && r.media.length > 0 ? { background: `url(${r.media[0].url}) center/cover` } : { background: 'linear-gradient(135deg,#1a0008,#3d001a)' }}>
                         {!r.media || r.media.length === 0 ? <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '30px', color: 'rgba(255,107,0,0.07)' }}>JL</div> : null}
                         <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'var(--orange)', color: '#fff', fontSize: '7px', fontWeight: 700, padding: '1px 5px', borderRadius: '2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{r.category}</div>
                      </div>
                      <div className="rel-title">{r.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* COMMENTS */}
            <div className="comments-section">
               {post.allowComments && <CommentSection postId={post._id.toString()} />}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="s-card">
            <div className="s-title"><div className="s-line"></div>Trending Now</div>
            <div id="sb-trending">
               <div className="trend-item">
                  <div className="trend-num">01</div>
                  <div><div className="trend-text">Burna Boy Breaks Spotify Record Again</div><div className="trend-cat">MUSIC</div></div>
               </div>
               <div className="trend-item">
                  <div className="trend-num">02</div>
                  <div><div className="trend-text">Super Eagles AFCON Squad Named</div><div className="trend-cat">SPORTS</div></div>
               </div>
               <div className="trend-item">
                  <div className="trend-num">03</div>
                  <div><div className="trend-text">Lagos Street Food Guide 2025</div><div className="trend-cat">LIFESTYLE</div></div>
               </div>
            </div>
          </div>

          <div className="nl-box">
            <div className="nl-title">Stay <span>Loaded</span></div>
            <div className="nl-sub">Fresh posts, music drops & vibes — straight to your inbox.</div>
            <input className="nl-input" placeholder="Your email..." />
            <button className="nl-btn">Subscribe Free</button>
          </div>

          <div className="s-card">
            <div className="s-title"><div className="s-line"></div>Quick Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: 'var(--orange)' }}>847</div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Likes</div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: 'var(--orange)' }} id="sb-ccount">14</div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comments</div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: 'var(--orange)' }}>{formatNumber(post.views || 1)}</div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Views</div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: 'var(--orange)' }}>{calculateReadTime(post.body)}m</div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Read Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
