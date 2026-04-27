import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Song from '@/models/Song';
import Video from '@/models/Video';
import Image from 'next/image';
import Link from 'next/link';

import LiveScoresTicker from '@/components/LiveScoresTicker';
import PostCard from '@/components/PostCard';
import MusicCard from '@/components/MusicCard';
import VideoCard from '@/components/VideoCard';
import { getAuthorDisplay } from '@/lib/authors';
import { timeAgo } from '@/lib/utils';

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
  slug: string;
  title: string;
};

type HomeSong = {
  _id: LeanId;
};

type HomeVideo = {
  _id: LeanId;
};

async function getHomepageData() {
  await dbConnect();

  const [latestPosts, songs, videos] = await Promise.all([
    Post.find({ status: 'published' }).sort({ createdAt: -1, _id: -1 }).limit(7).lean<HomePost[]>(),
    Song.find().sort({ createdAt: -1, _id: -1 }).limit(10).lean<HomeSong[]>(),
    Video.find().sort({ createdAt: -1, _id: -1 }).limit(6).lean<HomeVideo[]>(),
  ]);

  return {
    latestPosts,
    songs,
    videos,
  };
}

export default async function Home() {
  const { latestPosts, songs, videos } = await getHomepageData();

  const breakingNews = latestPosts.slice(0, 3);
  const heroPost = latestPosts[0] || null;
  const heroAuthor = heroPost ? getAuthorDisplay(heroPost.author) : null;
  const heroPhoto = heroPost?.media?.find((mediaItem) => mediaItem.type === 'photo') || null;
  const gridPosts = latestPosts.slice(heroPost ? 1 : 0, heroPost ? 7 : 6);

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
          {heroPost && (
            <Link href={`/blog/${heroPost.slug}`} className="hero block" style={{ textDecoration: 'none' }}>
              <div className="hero-img-bg">
                <div className="hero-pattern"></div>
                {heroPhoto?.url && (
                  <Image
                    src={heroPhoto.url}
                    alt={heroPost.title}
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'cover', opacity: 0.75 }}
                  />
                )}
              </div>
              <div className="hero-overlay"></div>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.06,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '120px',
                    color: '#FF6B00',
                    letterSpacing: '4px',
                    lineHeight: 1,
                  }}
                >
                  JALA
                  <br />
                  LOAD
                  <br />
                  ED
                </div>
              </div>
              <div className="hero-content">
                <div className="hero-badge">{heroPost.featured ? 'FEATURED POST' : 'LATEST POST'}</div>
                <div className="hero-title">{heroPost.title}</div>
                <div className="hero-meta">
                  <div className="hero-av">{heroAuthor?.initials || 'JA'}</div>
                  <span className="hero-author">By {heroAuthor?.name || 'Jalal'}</span>
                  <span className="hero-date">{timeAgo(heroPost.createdAt)} &bull; 5 min read</span>
                </div>
                <div className="hero-actions">
                  <button className="hero-btn hero-btn-primary">Read Full Post</button>
                  <button className="hero-btn hero-btn-ghost">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            </Link>
          )}

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
            {gridPosts.map((post) => (
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
              The Crew
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="hero-av" style={{ width: '38px', height: '38px', fontSize: '12px', flexShrink: 0 }}>
                  JA
                </div>
                <div>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '13px' }}>Jalal</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                    Creator and lead writer. Passionate about music, culture and street vibes.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(255,107,0,0.15)',
                    border: '1px solid rgba(255,107,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--orange)',
                    fontFamily: '"Syne", sans-serif',
                    flexShrink: 0,
                  }}
                >
                  CO
                </div>
                <div>
                  <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '13px' }}>Co-friend</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                    Co-author. Covers sports, entertainment and the latest gist.
                  </div>
                </div>
              </div>
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
