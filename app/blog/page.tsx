import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { ensurePublishedAtBackfill } from '@/lib/postPublishing';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog — Latest Entertainment News & Updates | Jalaloaded',
  description: 'Catch up on the latest entertainment news, trending topics, celebrity updates, and lifestyle stories on Jalaloaded.',
  alternates: {
    canonical: '/blog',
  },
};

type BlogPost = {
  _id: { toString(): string };
  author?: string;
  category: string;
  createdAt: Date | string;
  media?: Array<{ type: 'photo' | 'video'; url: string }>;
  publishedAt?: Date | string;
  slug: string;
  title: string;
  views?: number;
};

async function getPosts(page: number, category?: string, tag?: string) {
  await dbConnect();
  await ensurePublishedAtBackfill();

  const limit = 12;
  const skip = (page - 1) * limit;
  const query: any = { status: 'published' };

  if (category && category !== 'All') {
    query.category = category;
  }
  
  if (tag) {
    query.tags = { $regex: new RegExp(`^${tag}$`, 'i') };
  }

  const [posts, admins] = await Promise.all([
    Post.find(query)
      .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean<BlogPost[]>(),
    (await import('@/models/AdminUser')).default.find({}).select('displayName username profileImageUrl role').lean()
  ]);

  // Create a profile pic mapping
  const profileMap: Record<string, string> = {};
  const mainAdmin = (admins as any[]).find(a => a.role === 'admin');
  
  (admins as any[]).forEach(a => {
    if (a.profileImageUrl) {
      profileMap[a.displayName.toLowerCase()] = a.profileImageUrl;
      profileMap[a.username.toLowerCase()] = a.profileImageUrl;
    }
  });

  // Handle generic mapping for "Admin", "Main Admin", etc.
  if (mainAdmin?.profileImageUrl) {
    const genericNames = ['admin', 'main admin', 'administrator'];
    genericNames.forEach(name => {
      if (!profileMap[name]) profileMap[name] = mainAdmin.profileImageUrl;
    });
  }

  const enrichedPosts = posts.map(post => ({
    ...post,
    authorProfilePic: profileMap[post?.author?.toLowerCase() || ''] || null
  }));

  const total = await Post.countDocuments(query);

  return {
    posts: JSON.parse(JSON.stringify(enrichedPosts)),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}) {
  const resolvedParams = await searchParams;
  const requestedPage = typeof resolvedParams.page === 'string' ? Number.parseInt(resolvedParams.page, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const category = resolvedParams.category || 'All';
  const tag = resolvedParams.tag || '';

  const { posts, total, totalPages, currentPage } = await getPosts(page, category, tag);

  const categories = ['All', 'Music', 'Sports', 'Fashion', 'Lifestyle', 'News', 'Opinion', 'Events', 'Business', 'Health and Wellbeing', 'Sciences', 'Technology'];
  const showFeatured = currentPage === 1 && posts.length > 0;
  const featuredPost = showFeatured ? posts[0] : null;
  const gridPosts = showFeatured ? posts.slice(1) : posts;
  const pageHref = (targetPage: number, targetCategory = category) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set('page', String(targetPage));
    if (targetCategory !== 'All') params.set('category', targetCategory);
    if (tag) params.set('tag', tag);
    const query = params.toString();
    return query ? `/blog?${query}` : '/blog';
  };
  const paginationPages = Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter((item) => item >= 1 && item <= totalPages)),
  ).sort((a, b) => a - b);

  return (
    <div className="jlh blog-archive" style={{ position: 'relative', overflow: 'hidden', paddingBottom: '72px' }}>

      
      {/* AMBIENT BACKGROUND ORBS */}
      <div className="music-ambient-orb" style={{
        position: 'fixed', top: '-150px', left: '10%', width: '450px', height: '450px',
        background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', zIndex: 0
      }} />
      <div className="music-ambient-orb" style={{
        position: 'fixed', bottom: '-100px', right: '5%', width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, animationDelay: '3s'
      }} />

      <main className="blog-archive-inner" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* HEADER HERO BANNER */}
        <header className="blog-archive-hero">
          <div className="blog-archive-kicker"><span className="blog-live-indicator" aria-hidden="true" />The Jalaloaded edit</div>
          <div className="blog-archive-heading">
            <div>
              <p className="blog-archive-overline">Stories worth your scroll</p>
              <h1>{tag ? `Posts tagged “${tag}”` : category !== 'All' ? `${category} stories` : 'The gist & stories'}</h1>
            </div>
            <p>{tag ? `The latest articles filed under ${tag}.` : category !== 'All' ? `Fresh ${category.toLowerCase()} from the people, moments, and culture shaping the conversation.` : 'Fresh entertainment, street culture, breaking news, and the conversations everyone is having.'}</p>
          </div>
        </header>

        {/* CATEGORY FILTER PILLS */}
        {!tag && (
          <nav className="blog-filter-panel" aria-label="Browse posts by category">
            <span className="blog-filter-label">Browse by topic</span>
            <div className="blog-category-container">
              {categories.map((cat: string) => {
                const isActive = category === cat;
                return <Link key={cat} href={pageHref(1, cat)} className={`blog-cat-chip ${isActive ? 'active' : ''}`} aria-current={isActive ? 'page' : undefined}>{cat}</Link>;
              })}
            </div>
          </nav>
        )}

        {/* POSTS GRID */}
        {posts.length > 0 ? (
          <>
            {featuredPost && <section className="blog-feature" aria-label="Featured latest story"><PostCard post={featuredPost} /></section>}
            <div className="blog-results-heading">
              <div>
                <span>{showFeatured ? 'More from the feed' : 'Latest posts'}</span>
                <h2>{showFeatured ? 'Keep reading' : category === 'All' ? 'All stories' : `${category} stories`}</h2>
              </div>
              <p>{total} published {total === 1 ? 'story' : 'stories'}</p>
            </div>
            {gridPosts.length > 0 && (
              <div className="posts-grid blog-posts-grid">
                {gridPosts.map((post: any, index: number) => (
                  <div key={post._id.toString()} className="blog-post-item" style={{ animationDelay: `${Math.min(index * 0.05, 0.8)}s` }}>
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'linear-gradient(180deg, #181818 0%, #111111 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 0 12px rgba(255,107,0,0.4))' }}>📰</div>
            <h3 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: '8px' }}>No posts found</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Looks like we haven&apos;t published anything in this category yet. Check back soon!</p>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <nav className="blog-pagination" aria-label="Pagination">
            {currentPage > 1 && <Link href={pageHref(currentPage - 1)} className="blog-pagination-btn blog-pagination-arrow" aria-label="Previous page">← <span>Previous</span></Link>}
            <div className="blog-pagination-pages">
              {paginationPages.map((item, index) => (
                <span key={item} className="blog-pagination-group">
                  {index > 0 && item - paginationPages[index - 1] > 1 && <span className="blog-pagination-ellipsis">…</span>}
                  <Link href={pageHref(item)} className={`blog-pagination-btn ${currentPage === item ? 'active' : ''}`} aria-current={currentPage === item ? 'page' : undefined}>{item}</Link>
                </span>
              ))}
            </div>
            {currentPage < totalPages && <Link href={pageHref(currentPage + 1)} className="blog-pagination-btn blog-pagination-arrow" aria-label="Next page"><span>Next</span> →</Link>}
          </nav>
        )}
      </main>
    </div>
  );
}
