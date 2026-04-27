import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Song from '@/models/Song';
import Video from '@/models/Video';
import Link from 'next/link';

import HeroCarousel, { type HeroCarouselSlide } from '@/components/HeroCarousel';
import LiveScoresTicker from '@/components/LiveScoresTicker';
import PostCard from '@/components/PostCard';
import MusicCard from '@/components/MusicCard';
import VideoCard from '@/components/VideoCard';
import { ensurePublishedAtBackfill } from '@/lib/postPublishing';

export const dynamic = 'force-dynamic';

type LeanId = {
  toString(): string;
};

type HomeMedia = {
  type: 'photo' | 'video';
  url: string;
};

type HomePost = {
  _id: LeanId;
  author: string;
  category: string;
  createdAt: Date | string;
  featured?: boolean;
  media?: HomeMedia[];
  publishedAt?: Date | string;
  slug: string;
  title: string;
};

type HomeSong = {
  _id: LeanId;
};

type HomeVideo = {
  _id: LeanId;
};

function dedupePosts(posts: HomePost[]) {
  const seen = new Set<string>();

  return posts.filter((post) => {
    const id = post._id.toString();

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

async function getHomepageData() {
  await dbConnect();
  await ensurePublishedAtBackfill();

  const [featuredPosts, recentPosts, songs, videos] = await Promise.all([
    Post.find({ status: 'published', featured: true })
      .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(4)
      .lean<HomePost[]>(),
    Post.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1, _id: -1 }).limit(10).lean<HomePost[]>(),
    Song.find().sort({ createdAt: -1, _id: -1 }).limit(10).lean<HomeSong[]>(),
    Video.find().sort({ createdAt: -1, _id: -1 }).limit(6).lean<HomeVideo[]>(),
  ]);

  // Carousel ONLY shows posts explicitly marked as "featured" by admin.
  // If no posts are featured, show the single most recent post as a fallback hero.
  const carouselPosts = featuredPosts.length > 0
    ? dedupePosts(featuredPosts).slice(0, 4)
    : dedupePosts(recentPosts).slice(0, 1);
  
  // Always show the 6 most recent posts in the grid below the hero.
  const latestPosts = recentPosts.slice(0, 6);

  return {
    latestPosts,
    recentPosts,
    carouselPosts,
    songs,
    videos,
  };
}

export default async function Home() {
  const { latestPosts, recentPosts, carouselPosts, songs, videos } = await getHomepageData();

  const breakingNews = recentPosts.slice(0, 3);
  const heroSlides: HeroCarouselSlide[] = carouselPosts.map((post) => ({
    author: post.author,
    category: post.category,
    createdAt: new Date(post.publishedAt || post.createdAt).toISOString(),
    featured: Boolean(post.featured),
    id: post._id.toString(),
    imageUrl: post.media?.find((mediaItem) => mediaItem.type === 'photo')?.url || null,
    slug: post.slug,
    title: post.title,
  }));

  return (
    <div className="jlh min-h-screen">
      {breakingNews.length > 0 && (
        <div className="breaking">
          <div className="break-label">LATEST</div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <span className="break-text">
              {breakingNews.map((post) => `${post.title}`).join(' \u00a0\u00a0\u2022\u00a0\u00a0 ')}
            </span>
          </div>
        </div>
      )}

      <LiveScoresTicker />

      <div className="page">
        <div style={{ minWidth: 0 }}>
          {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

          <div className="sec-hdr" style={{ marginTop: '0' }}>
            <div className="sec-title">
              <div className="sec-line"></div>
              Latest Posts
            </div>
            <Link href="/blog" className="sec-more">
              View all &rarr;
            </Link>
          </div>
          <div className="posts-grid">
            {latestPosts.map((post) => (
              <PostCard key={post._id.toString()} post={post} />
            ))}
          </div>

          <div className="sec-hdr">
            <div className="sec-title">
              <div className="sec-line"></div>
              Fresh Music
            </div>
            <Link href="/music" className="sec-more">
              All tracks &rarr;
            </Link>
          </div>
          <div className="music-section">
            <div className="music-scroll">
              {songs.map((song) => (
                <MusicCard key={song._id.toString()} song={song} />
              ))}
            </div>
          </div>

          <div className="sec-hdr">
            <div className="sec-title">
              <div className="sec-line"></div>
              Videos
            </div>
            <Link href="/videos" className="sec-more">
              All videos &rarr;
            </Link>
          </div>
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard key={video._id.toString()} video={video} />
            ))}
          </div>

          <div className="newsletter">
            <div className="nl-title">
              Stay <span>Loaded</span>
            </div>
            <div className="nl-sub">
              Get the freshest posts, music drops and videos delivered to your inbox. No spam, only vibes.
            </div>
            <div className="nl-form">
              <input className="nl-input" placeholder="Enter your email address..." />
              <button className="nl-btn">Subscribe</button>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="s-card">
            <div className="s-title">
              <div className="s-line"></div>
              Trending Now
            </div>
            <div>
              {latestPosts.slice(0, 5).map((post, index) => (
                <Link
                  href={`/blog/${post.slug}`}
                  key={post._id.toString()}
                  className="trend-item block"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="trend-num">0{index + 1}</div>
                  <div>
                    <div className="trend-text">{post.title}</div>
                    <div className="trend-cat">{post.category}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="s-card">
            <div className="s-title">
              <div className="s-line"></div>
              Reader Poll
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: '"Syne", sans-serif',
                marginBottom: '10px',
                lineHeight: 1.4,
              }}
            >
              Who is the best African footballer right now?
            </div>
            <div>
              {[
                { label: 'Victor Osimhen', votes: 1240 },
                { label: 'Sadio Mane', votes: 820 },
                { label: 'Mohamed Salah', votes: 620 },
                { label: 'Achraf Hakimi', votes: 167 },
              ].map((option, index) => (
                <div key={index} className="poll-opt">
                  <div className="poll-label">
                    <span>{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
              Click to vote &bull; 2,847 votes
            </div>
          </div>

          <div className="s-card">
            <div className="s-title">
              <div className="s-line"></div>
              Popular Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {['Afrobeats', 'Football', 'AFCON', 'Lagos', 'Fashion', 'Music', 'Film', 'Gist', 'Naija', 'Sport'].map(
                (tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      border: '0.5px solid var(--color-border-secondary)',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
