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

  const posts = await Post.find(query)
    .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean<BlogPost[]>();

  const total = await Post.countDocuments(query);

  return {
    posts: JSON.parse(JSON.stringify(posts)),
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

  const categories = ['All', 'Music', 'Sports', 'Fashion', 'Lifestyle', 'News', 'Opinion', 'Events'];

  return (
    <div className="jlh min-h-screen">
      <div className="page" style={{ gridTemplateColumns: '1fr', maxWidth: '1240px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
          <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '48px', letterSpacing: '2px', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
            {tag ? `Posts tagged "${tag}"` : 'THE GIST & STORIES'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontFamily: '"Lora", serif', marginTop: '12px', lineHeight: '1.6' }}>
            {tag 
              ? `Browsing all articles under the tag ${tag}.` 
              : 'Dive into the latest happenings, from street trends to global news. Pick a category or browse all.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={cat !== 'All' ? `/blog?category=${cat}` : '/blog'}
              className="tag-pill"
              style={{
                textDecoration: 'none',
                background: category === cat ? 'var(--orange)' : 'transparent',
                color: category === cat ? '#fff' : 'var(--color-text-secondary)',
                borderColor: category === cat ? 'var(--orange)' : 'var(--color-border-secondary)',
              }}
            >
              {cat}
            </Link>
          ))}
        </div>

        {posts.length > 0 ? (
          <div className="posts-grid">
            {posts.map((post: any) => (
              <PostCard key={post._id.toString()} post={post} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--color-background-primary)', borderRadius: '14px', border: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>Posts</div>
            <h3 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>No posts found</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Looks like we haven&apos;t published anything in this category yet.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Link
                key={i}
                href={`/blog?page=${i + 1}${category !== 'All' ? '&category=' + category : ''}`}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  fontFamily: '"Syne", sans-serif',
                  fontWeight: 700,
                  fontSize: '13px',
                  textDecoration: 'none',
                  border: '1px solid',
                  background: currentPage === i + 1 ? 'var(--orange)' : 'var(--color-background-primary)',
                  color: currentPage === i + 1 ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: currentPage === i + 1 ? 'var(--orange)' : 'var(--color-border-tertiary)',
                }}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
