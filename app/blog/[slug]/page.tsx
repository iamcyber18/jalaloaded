import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Advert from '@/models/Advert';
import MediaBlock from '@/components/MediaBlock';
import CommentSection from '@/components/CommentSection';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';
import AdvertSlider from '@/components/AdvertSlider';
import NewsletterForm from '@/components/NewsletterForm';
import Link from 'next/link';
import { getAuthorDisplay } from '@/lib/authors';
import { timeAgo, calculateReadTime, formatNumber } from '@/lib/utils';
import { ensurePublishedAtBackfill } from '@/lib/postPublishing';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const post = await Post.findOne({ slug, status: 'published' }).lean();
  if (!post) return { title: 'Post Not Found' };

  const title = post.title;
  const description = typeof post.body === 'string' ? post.body.slice(0, 160).replace(/[#*_\n]/g, '').trim() + '...' : 'Read on Jalaloaded';
  const image = post.media?.[0]?.url || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

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
    isActive: true,
    $or: [
      { startDate: { $exists: false }, endDate: { $exists: false } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $exists: false } },
      { startDate: { $exists: false }, endDate: { $gte: now } },
    ]
  }).lean();

  // Get trending posts (most viewed, excluding current)
  const trending = await Post.find({
    _id: { $ne: post._id },
    status: 'published'
  }).sort({ views: -1 }).limit(3).select('title slug category').lean();

  // Get categories with post counts
  const categories = await Post.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return { 
    post: JSON.parse(JSON.stringify(post)), 
    related: JSON.parse(JSON.stringify(related)),
    adverts: JSON.parse(JSON.stringify(allAds)),
    trending: JSON.parse(JSON.stringify(trending)),
    categories: JSON.parse(JSON.stringify(categories))
  };
}

export default async function SinglePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const data = await getPost(resolvedParams.slug);
  
  if (!data) {
    notFound();
  }

  const { post, related, adverts, trending, categories } = data;
  const author = getAuthorDisplay(post.author);

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
                  <LikeButton songId={post._id.toString()} initialLikes={post.likes || 0} />
                  <ShareButton title={post.title} />
                </div>
              </div>
            </div>

            {/* MEDIA BLOCK */}
            <MediaBlock mediaItems={post.media || []} />

            {/* ARTICLE BODY WITH IMAGES BETWEEN SECTIONS */}
            <div className="article-body">
              {(() => {
                const content = post.body || '';
                const allPhotos = (post.media || []).filter((m: any) => m.type === 'photo');
                
                // Group photos by position
                const afterIntro = allPhotos.filter((p: any) => p.position === 'after-intro');
                const afterMain = allPhotos.filter((p: any) => p.position === 'after-main');
                const afterConclusion = allPhotos.filter((p: any) => p.position === 'after-conclusion');
                
                const mdProps = { remarkPlugins: [remarkGfm], components: { blockquote: ({children}: any) => <div className="pull-quote"><p>{children}</p></div>, p: ({children}: any) => <p>{children}</p> } };
                const inlineImgStyle = { width: '100%', maxHeight: '380px', objectFit: 'cover' as const, display: 'block', borderRadius: '10px' };
                const imgWrap = { margin: '24px 0', borderRadius: '10px', overflow: 'hidden', background: '#000' };
                
                const renderPhotos = (photos: any[]) => photos.map((p: any, i: number) => (
                  <div key={i} style={imgWrap}><img src={p.url} alt="Article image" style={inlineImgStyle} /></div>
                ));

                // Split body into sections using '---' divider
                const sections = content.split('\n---\n');
                
                if (sections.length >= 3) {
                  return (
                    <>
                      <ReactMarkdown {...mdProps}>{sections[0]}</ReactMarkdown>
                      {renderPhotos(afterIntro)}
                      {adverts.length > 0 && <div style={{ margin: '32px 0' }}><AdvertSlider adverts={adverts} seedOffset={0} /></div>}
                      <ReactMarkdown {...mdProps}>{sections[1]}</ReactMarkdown>
                      {renderPhotos(afterMain)}
                      <ReactMarkdown {...mdProps}>{sections.slice(2).join('\n---\n')}</ReactMarkdown>
                      {renderPhotos(afterConclusion)}
                    </>
                  );
                }

                if (sections.length === 2) {
                  return (
                    <>
                      <ReactMarkdown {...mdProps}>{sections[0]}</ReactMarkdown>
                      {renderPhotos(afterIntro)}
                      {adverts.length > 0 && <div style={{ margin: '32px 0' }}><AdvertSlider adverts={adverts} seedOffset={0} /></div>}
                      <ReactMarkdown {...mdProps}>{sections[1]}</ReactMarkdown>
                      {renderPhotos(afterMain)}
                      {renderPhotos(afterConclusion)}
                    </>
                  );
                }

                // Single section fallback
                const blocks = content.split('\n\n');
                if (blocks.length > 3) {
                  const mid = Math.floor(blocks.length / 2);
                  return (
                    <>
                      <ReactMarkdown {...mdProps}>{blocks.slice(0, mid).join('\n\n')}</ReactMarkdown>
                      {renderPhotos(afterIntro)}
                      {adverts.length > 0 && <div style={{ margin: '32px 0' }}><AdvertSlider adverts={adverts} seedOffset={0} /></div>}
                      <ReactMarkdown {...mdProps}>{blocks.slice(mid).join('\n\n')}</ReactMarkdown>
                      {renderPhotos(afterMain)}
                      {renderPhotos(afterConclusion)}
                    </>
                  );
                }

                return (
                  <>
                    <ReactMarkdown {...mdProps}>{content}</ReactMarkdown>
                    {renderPhotos(afterIntro)}
                    {renderPhotos(afterMain)}
                    {renderPhotos(afterConclusion)}
                    {adverts.length > 0 && <div style={{ margin: '32px 0' }}><AdvertSlider adverts={adverts} seedOffset={0} /></div>}
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
                <LikeButton songId={post._id.toString()} initialLikes={post.likes || 0} />
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
          {adverts.length > 0 && (
            <div className="s-card" style={{ padding: 0, overflow: 'hidden', background: 'transparent', border: 'none' }}>
              <AdvertSlider adverts={adverts} seedOffset={2} />
            </div>
          )}

          <div className="s-card">
            <div className="s-title"><div className="s-line"></div>Trending Now</div>
            <div id="sb-trending">
              {trending && trending.length > 0 ? trending.map((t: any, i: number) => (
                <Link href={`/blog/${t.slug}`} key={t._id} style={{ textDecoration: 'none' }}>
                  <div className="trend-item">
                    <div className="trend-num">{String(i + 1).padStart(2, '0')}</div>
                    <div><div className="trend-text">{t.title}</div><div className="trend-cat">{t.category?.toUpperCase()}</div></div>
                  </div>
                </Link>
              )) : (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', padding: '8px 0' }}>No trending posts yet.</div>
              )}
            </div>
          </div>

          <div className="s-card">
            <div className="s-title"><div className="s-line"></div>Categories</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {categories && categories.map((cat: any) => (
                <Link href={`/?category=${cat._id}`} key={cat._id} style={{ textDecoration: 'none' }}>
                  <div className="trend-item" style={{ padding: '8px 0' }}>
                    <div className="trend-num" style={{ fontSize: '10px' }}>{cat.count}</div>
                    <div><div className="trend-text">{cat._id}</div></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="nl-box">
            <div className="nl-title">Stay <span>Loaded</span></div>
            <div className="nl-sub">Fresh posts, music drops & vibes — straight to your inbox.</div>
            <NewsletterForm isSidebar={true} />
          </div>

          <div className="s-card">
            <div className="s-title"><div className="s-line"></div>Quick Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: 'var(--orange)' }}>{formatNumber(post.likes || 0)}</div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Likes</div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: 'var(--orange)' }} id="sb-ccount">{formatNumber(post.comments?.length || 0)}</div>
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
