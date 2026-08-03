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
import ShareButton from '@/components/ShareButton';
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

  const [featuredPosts, recentPosts, songs, standardVideos, activeAdverts, admins, activeLive] = await Promise.all([
    Post.find({ status: 'published', featured: true })
      .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(6)
      .lean<HomePost[]>(),
    Post.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1, _id: -1 }).limit(8).lean<HomePost[]>(),
    Song.find().sort({ createdAt: -1, _id: -1 }).limit(6).lean<HomeSong[]>(),
    Video.find().sort({ createdAt: -1, _id: -1 }).limit(6).lean<HomeVideo[]>(),
    Advert.find({ isActive: true }).lean<HomeAdvert[]>(),
    (await import('@/models/AdminUser')).default.find({}).select('displayName username profileImageUrl role').lean(),
    (await import('@/models/LiveStream')).default.find({ isActive: true }).lean()
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

  const enrichPost = (post: HomePost) => ({
    ...post,
    authorProfilePic: profileMap[post.author.toLowerCase()] || null
  });

  const enrichedFeatured = featuredPosts.map(enrichPost);
  const enrichedRecent = recentPosts.map(enrichPost);

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

  const allVideos = [...standardVideos, ...mappedSongs]
    .sort((a, b) => new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime());

  // Prepare carousel and latest posts using ENRICHED lists
  const carouselPosts = enrichedFeatured.length > 0
    ? dedupePosts(enrichedFeatured).slice(0, 6)
    : dedupePosts(enrichedRecent).slice(0, 1);
  
  const latestPosts = enrichedRecent.slice(0, 8);

  // Fetch popular tags dynamically
  const tagsAggregation = await Post.aggregate([
    { $match: { status: 'published', tags: { $exists: true, $not: { $size: 0 } } } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 }
  ]);
  const popularTags = tagsAggregation.map(t => t._id);

  return {
    carouselPosts: JSON.parse(JSON.stringify(carouselPosts)),
    latestPosts: JSON.parse(JSON.stringify(latestPosts)),
    recentPosts: JSON.parse(JSON.stringify(enrichedRecent)),
    songs: JSON.parse(JSON.stringify(songs)),
    videos: JSON.parse(JSON.stringify(allVideos)),
    adverts: JSON.parse(JSON.stringify(activeAdverts)),
    activeLive: JSON.parse(JSON.stringify(activeLive)),
    popularTags,
  };
}

export default async function Home() {
  const { latestPosts, recentPosts, carouselPosts, songs, videos, adverts, popularTags, activeLive } = await getHomepageData();

  const breakingNews = recentPosts.slice(0, 3);
  const heroSlides: HeroCarouselSlide[] = carouselPosts.map((post: any) => ({
    author: post.author,
    category: post.category,
    createdAt: new Date(post.publishedAt || post.createdAt).toISOString(),
    featured: Boolean(post.featured),
    id: post._id.toString(),
    imageUrl: post.media?.find((mediaItem: any) => mediaItem.type === 'photo')?.url || null,
    slug: post.slug,
    title: post.title,
    authorProfilePic: post.authorProfilePic,
  }));

  return (
    <div className="jlh min-h-screen">
      <h1 className="sr-only">Jalaloaded — Premier Entertainment, Music, Latest News & Live Scores</h1>
      {activeLive && activeLive.length > 0 && (
        <div style={{ background: '#FF0000', color: '#fff', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: '6px' }}>
          {activeLive.map((stream: any, i: number) => (
            <div key={stream._id} style={{ 
              padding: '6px 20px', display: 'flex', alignItems: 'center', gap: '12px', 
              position: 'relative', overflow: 'hidden', borderRight: i < activeLive.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer 2s infinite' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', zIndex: 1 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }}></div>
                <span style={{ fontWeight: 800, fontSize: '9px', letterSpacing: '1px' }}>LIVE</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '12px', zIndex: 1, whiteSpace: 'nowrap' }}>{stream.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                <Link href={`/live?v=${stream._id}`} style={{ background: '#fff', color: '#FF0000', padding: '3px 12px', borderRadius: '20px', fontSize: '9px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  WATCH
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      {breakingNews.length > 0 && (
        <div className="breaking">
          <div className="break-label">LATEST</div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <span className="break-text">
              {breakingNews.map((post: any) => `${post.title}`).join(' \u00a0\u00a0\u2022\u00a0\u00a0 ')}
            </span>
          </div>
        </div>
      )}

      <LiveScoresTicker />

      <div className="page">
        <div style={{ minWidth: 0 }}>
          {/* HERO SECTION WITH AMBIENT NEON GLOW */}
          {heroSlides.length > 0 && (
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(255,107,0,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
                filter: 'blur(40px)',
                zIndex: 0
              }} />
              <HeroCarousel slides={heroSlides} />
            </div>
          )}

          {/* LATEST STORIES SECTION */}
          <div className="sec-hdr" style={{ marginTop: '8px' }}>
            <div className="sec-title">
              <span className="sec-icon">🔥</span>
              <div className="sec-line"></div>
              Latest Stories
            </div>
            <Link href="/blog" className="sec-more">
              View all posts &rarr;
            </Link>
          </div>
          <div className="posts-grid">
            {latestPosts.map((post: any) => (
              <PostCard key={post._id.toString()} post={post} />
            ))}
          </div>

          {/* FRESH MUSIC SECTION */}
          <div className="sec-hdr" style={{ marginTop: '24px' }}>
            <div className="sec-title">
              <span className="sec-icon">🎵</span>
              <div className="sec-line"></div>
              Fresh Music Drops
            </div>
            <Link href="/music" className="sec-more">
              Explore music &rarr;
            </Link>
          </div>
          <div className="music-section">
            <div className="music-scroll">
              {songs.map((song: any) => (
                <MusicCard key={song._id.toString()} song={song} />
              ))}
            </div>
          </div>

          {/* TRENDING VIDEOS SECTION */}
          <div className="sec-hdr" style={{ marginTop: '24px' }}>
            <div className="sec-title">
              <span className="sec-icon">🎬</span>
              <div className="sec-line"></div>
              Trending Videos & Premieres
            </div>
            <Link href="/videos" className="sec-more">
              Watch all &rarr;
            </Link>
          </div>
          <div className="video-grid">
            {videos.map((video: any) => (
              <VideoCard key={video._id.toString()} video={video} />
            ))}
          </div>

          {/* FLASHY NEWSLETTER CONTAINER */}
          <div className="newsletter" style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #111111 0%, #1a0d04 50%, #0d0d0d 100%)',
            border: '1px solid rgba(255, 107, 0, 0.3)',
            boxShadow: '0 12px 36px rgba(255, 107, 0, 0.1)',
            borderRadius: '16px',
            padding: '28px 24px',
            marginTop: '28px'
          }}>
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,107,0,0.2) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div className="nl-title" style={{ fontSize: '28px', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px' }}>
              STAY <span style={{ color: '#FF6B00', textShadow: '0 0 12px rgba(255,107,0,0.5)' }}>LOADED</span>
            </div>
            <div className="nl-sub" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', maxWidth: '480px', margin: '0 auto 18px' }}>
              Get instant alerts for new music downloads, viral news, and live football updates delivered straight to you.
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
              {latestPosts.slice(0, 5).map((post: any, index: number) => (
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
              {popularTags.length > 0 ? popularTags.map(
                (tag: string) => (
                  <Link
                    href={`/blog?tag=${tag}`}
                    key={tag}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      border: '0.5px solid var(--color-border-secondary)',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textDecoration: 'none'
                    }}
                  >
                    {tag}
                  </Link>
                )
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No tags yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
