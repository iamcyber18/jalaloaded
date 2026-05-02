import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Song from '@/models/Song';
import Video from '@/models/Video';
import Advert from '@/models/Advert';
import Link from 'next/link';

import HeroCarousel, { type HeroCarouselSlide } from '@/components/HeroCarousel';
import LiveScoresTicker from '@/components/LiveScoresTicker';
import PostCard from '@/components/PostCard';
import MusicCard from '@/components/MusicCard';
import VideoCard from '@/components/VideoCard';
import NewsletterForm from '@/components/NewsletterForm';
import AdvertSlider from '@/components/AdvertSlider';
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
  createdAt: Date | string;
};

type HomeVideo = {
  _id: LeanId;
  createdAt: Date | string;
};

type HomeAdvert = {
  _id: LeanId;
  title: string;
  imageUrl: string;
  linkUrl: string;
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

  const [featuredPosts, recentPosts, songs, standardVideos, activeAdverts] = await Promise.all([
    Post.find({ status: 'published', featured: true })
      .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(6)
      .lean<HomePost[]>(),
    Post.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1, _id: -1 }).limit(8).lean<HomePost[]>(),
    Song.find().sort({ createdAt: -1, _id: -1 }).limit(6).lean<HomeSong[]>(),
    Video.find().sort({ createdAt: -1, _id: -1 }).limit(6).lean<HomeVideo[]>(),
    Advert.find({ isActive: true }).lean<HomeAdvert[]>(),
  ]);

  // Mix Song videos into Video feed for homepage
  const songsWithVideos = await Song.find({ videoUrl: { $exists: true, $ne: '' } }).sort({ createdAt: -1 }).limit(6).lean();
  const mappedSongs = songsWithVideos.map(song => ({
    _id: song._id,
    title: `${song.artist} - ${song.title} (Official Video)`,
    mediaUrl: song.videoUrl,
    thumbnailUrl: song.coverUrl,
    duration: song.duration || 0,
    description: song.description,
    author: 'jalal',
    views: song.plays,
    likes: song.likes,
    category: 'Music Videos',
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
    isSongVideo: true,
    slug: song.slug || song._id
  }));

  const videos = [...standardVideos, ...mappedSongs]
    .sort((a, b) => new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime())
    .slice(0, 6);

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
    adverts: activeAdverts.map(ad => ({ ...ad, _id: ad._id.toString() })),
  };
}

export default async function Home() {
  const { latestPosts, recentPosts, carouselPosts, songs, videos, adverts } = await getHomepageData();

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

          {adverts.length > 0 && (
            <div style={{ marginTop: '30px', marginBottom: '10px' }}>
              <AdvertSlider adverts={adverts} seedOffset={0} />
            </div>
          )}

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
            <NewsletterForm />
          </div>
        </div>

        <div className="sidebar">
          {adverts.length > 0 && (
            <div className="s-card" style={{ padding: 0, overflow: 'hidden', background: 'transparent', border: 'none' }}>
              <AdvertSlider adverts={adverts} seedOffset={1} />
            </div>
          )}

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
