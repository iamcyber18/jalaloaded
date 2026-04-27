import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Advert from '@/models/Advert';
import MediaBlock from '@/components/MediaBlock';
import CommentSection from '@/components/CommentSection';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';
import AdBanner from '@/components/AdBanner';
import Link from 'next/link';
import { getAuthorDisplay } from '@/lib/authors';
import { timeAgo, calculateReadTime, formatNumber } from '@/lib/utils';
import { ensurePublishedAtBackfill } from '@/lib/postPublishing';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const dynamic = 'force-dynamic';

type RelatedPost = {
  _id: { toString(): string };
  category: string;
  media?: Array<{ url: string }>;
  slug: string;
  title: string;
};

async function getPost(slug: string) {
  await dbConnect();
  await ensurePublishedAtBackfill();
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
  }).sort({ publishedAt: -1, createdAt: -1, _id: -1 }).limit(3).lean<RelatedPost[]>();

  // Get random active inline ads
  const now = new Date();
  const allAds = await Advert.find({
    placement: 'blog-inline',
    isActive: true,
    $or: [
      { startDate: { $exists: false }, endDate: { $exists: false } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $exists: false } },
      { startDate: { $exists: false }, endDate: { $gte: now } },
    ]
  }).lean();

  // Shuffle and pick up to 2
  const shuffledAds = allAds.sort(() => 0.5 - Math.random());
  const selectedAds = shuffledAds.slice(0, 2);

  return { 
    post: JSON.parse(JSON.stringify(post)), 
    related: JSON.parse(JSON.stringify(related)),
    adverts: JSON.parse(JSON.stringify(selectedAds))
  };
}

export default async function SinglePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const data = await getPost(resolvedParams.slug);
  
  if (!data) {
    notFound();
  }

  const { post, related, adverts } = data;
  const author = getAuthorDisplay(post.author);
  
  const ad1 = adverts && adverts.length > 0 ? adverts[0] : null;
  const ad2 = adverts && adverts.length > 1 ? adverts[1] : null;

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
                  <div className="av" style={{ background: 'var(--orange)' }}>{author.initials}</div>
                  <div className="av-info">
                    <div className="av-name">{author.name}</div>
                    <div className="av-role">Writer &bull; Jalaloaded</div>
                  </div>
                </div>
                <div className="meta-divider"></div>
                <div className="meta-item">
                  <div className="meta-label">Published</div>
                  <div className="meta-val">{timeAgo(post.publishedAt || post.createdAt)}</div>
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
                  <LikeButton postId={post._id.toString()} initialLikes={post.likes || 0} />
                  <ShareButton title={post.title} />
                </div>
              </div>
            </div>

            {/* MEDIA BLOCK */}
            <MediaBlock mediaItems={post.media || []} />

            {/* BODY WITH AD BANNER */}
            <div className="article-body">
              {(() => {
                const content = post.body || '';
                // Try to split at the conclusion divider '---'
                const parts = content.split('\n---\n');
                
                if (parts.length > 1) {
                  return (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ blockquote: ({children}) => <div className="pull-quote"><p>{children}</p></div>, p: ({children}) => <p>{children}</p> }}>
                        {parts[0]}
                      </ReactMarkdown>
                      {ad1 && (
                        <div style={{ margin: '32px 0' }}>
                          <AdBanner ad={ad1} />
                        </div>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ blockquote: ({children}) => <div className="pull-quote"><p>{children}</p></div>, p: ({children}) => <p>{children}</p> }}>
                        {parts.slice(1).join('\n---\n')}
                      </ReactMarkdown>
                      {ad2 && (
                        <div style={{ margin: '32px 0' }}>
                          <AdBanner ad={ad2} />
                        </div>
                      )}
                    </>
                  );
                }

                // Fallback: split by double newline and insert near middle
                const blocks = content.split('\n\n');
                if (blocks.length > 3) {
                  const mid = Math.floor(blocks.length / 2);
                  return (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ blockquote: ({children}) => <div className="pull-quote"><p>{children}</p></div>, p: ({children}) => <p>{children}</p> }}>
                        {blocks.slice(0, mid).join('\n\n')}
                      </ReactMarkdown>
                      {ad1 && (
                        <div style={{ margin: '32px 0' }}>
                          <AdBanner ad={ad1} />
                        </div>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ blockquote: ({children}) => <div className="pull-quote"><p>{children}</p></div>, p: ({children}) => <p>{children}</p> }}>
                        {blocks.slice(mid).join('\n\n')}
                      </ReactMarkdown>
                      {ad2 && (
                        <div style={{ margin: '32px 0' }}>
                          <AdBanner ad={ad2} />
                        </div>
                      )}
                    </>
                  );
                }

                // If content is very short, just append it at the end
                return (
                  <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ blockquote: ({children}) => <div className="pull-quote"><p>{children}</p></div>, p: ({children}) => <p>{children}</p> }}>
                      {content}
                    </ReactMarkdown>
                    {ad1 && (
                      <div style={{ margin: '32px 0' }}>
                        <AdBanner ad={ad1} />
                      </div>
                    )}
                  </>
                );
              })()}
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
                <LikeButton postId={post._id.toString()} initialLikes={post.likes || 0} />
              </div>
              <div className="views-info">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>{formatNumber(post.views || 1)} views</span>
              </div>
            </div>

            {/* AUTHOR BIO */}
            <div className="author-bio">
              <div className="bio-av">{author.initials}</div>
              <div>
                <div className="bio-name">{getAuthorDisplay(post.author).name} — Writer at Jalaloaded</div>
                <div className="bio-text">Passionately covering music, culture, street life, and everything in between.</div>
                <button className="bio-follow">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Follow {author.name}
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
