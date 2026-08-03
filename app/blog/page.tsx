import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { ensurePublishedAtBackfill } from '@/lib/postPublishing';

export const dynamic = 'force-dynamic';

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
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const category = resolvedParams.category || 'All';
  const tag = resolvedParams.tag || '';

  const { posts, totalPages, currentPage } = await getPosts(page, category, tag);

  const categories = ['All', 'Music', 'Sports', 'Fashion', 'Lifestyle', 'News', 'Opinion', 'Events', 'Business', 'Health and Wellbeing', 'Sciences', 'Technology'];

  return (
    <div className="jlh min-h-screen" style={{ position: 'relative', overflow: 'hidden', paddingBottom: '60px' }}>

      
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

      <div className="page" style={{ gridTemplateColumns: '1fr', maxWidth: '1240px', margin: '0 auto', padding: '36px 20px', position: 'relative', zIndex: 1 }}>
        
        {/* HEADER HERO BANNER */}
        <div style={{ textAlign: 'center', marginBottom: '36px', maxWidth: '640px', margin: '0 auto 36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '20px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', color: '#FF6B00', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>
            <div className="live-dot" style={{ width: '6px', height: '6px', background: '#FF6B00' }} />
            LIVE FEED & STORIES
          </div>

          <h1 style={{
            fontFamily: '"Bebas Neue", sans-serif', fontSize: '52px', letterSpacing: '2.5px',
            color: '#fff', textTransform: 'uppercase', margin: 0, lineHeight: 1,
            textShadow: '0 0 24px rgba(255,107,0,0.3)'
          }}>
            {tag ? `POSTS TAGGED "${tag}"` : 'THE GIST & STORIES'}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '12px', lineHeight: '1.6', fontFamily: '"Syne", sans-serif' }}>
            {tag 
              ? `Browsing all articles under the tag ${tag}.` 
              : 'Dive into the latest happenings, street trends, viral culture, and breaking news.'}
          </p>
        </div>

        {/* CATEGORY FILTER PILLS */}
        <div className="blog-category-container" style={{ justifyContent: 'center' }}>
          {categories.map((cat: string) => {
            const isActive = category === cat;
            return (
              <Link
                key={cat}
                href={cat !== 'All' ? `/blog?category=${cat}` : '/blog'}
                className={`blog-cat-chip ${isActive ? 'active' : ''}`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* POSTS GRID */}
        {posts.length > 0 ? (
          <div className="posts-grid">
            {posts.map((post: any, index: number) => (
              <div key={post._id.toString()} className="blog-post-item" style={{ animationDelay: `${Math.min(index * 0.05, 0.8)}s` }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'linear-gradient(180deg, #181818 0%, #111111 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 0 12px rgba(255,107,0,0.4))' }}>📰</div>
            <h3 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: '8px' }}>No posts found</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Looks like we haven&apos;t published anything in this category yet. Check back soon!</p>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {Array.from({ length: totalPages }).map((_: any, i: number) => {
              const isCurrent = currentPage === i + 1;
              return (
                <Link
                  key={i}
                  href={`/blog?page=${i + 1}${category !== 'All' ? '&category=' + category : ''}`}
                  className={`blog-pagination-btn ${isCurrent ? 'active' : ''}`}
                >
                  {i + 1}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

