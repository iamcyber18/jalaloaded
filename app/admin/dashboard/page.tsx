'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';
import { formatNumber, timeAgo } from '@/lib/utils';
import { BarChart3, Newspaper, Eye, Music, Mail, Video, Settings, FolderOpen, Disc3, Headphones, Trophy, RefreshCw, Zap, Play, Download, Star, Calendar, Circle, Crown, PenTool } from 'lucide-react';

type DashboardPost = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  status: 'published' | 'draft';
  featured?: boolean;
  allowComments?: boolean;
  views?: number;
  createdAt: string;
  updatedAt: string;
};

type DashboardSong = {
  _id: string;
  title: string;
  artist: string;
  genre: string;
  status?: 'Published' | 'Pending';
  plays?: number;
  downloads?: number;
  coverUrl?: string;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const { session, loading: sessionLoading } = useAdminSession();
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [songs, setSongs] = useState<DashboardSong[]>([]);
  const [videosCount, setVideosCount] = useState(0);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | '30d' | '7d'>('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Posts
      const postsRes = await fetch('/api/posts?status=all&limit=200');
      const postsData = await postsRes.json();
      if (postsRes.ok) setPosts(postsData.posts || []);

      // 2. Fetch Songs
      const songsRes = await fetch('/api/songs?admin=true&limit=200');
      if (songsRes.ok) {
        const songsData = await songsRes.json();
        if (Array.isArray(songsData)) setSongs(songsData);
      }

      // 3. Fetch Videos
      const videosRes = await fetch('/api/videos?limit=200');
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        if (Array.isArray(videosData)) setVideosCount(videosData.length);
      }

      // 4. Fetch Newsletter Subscribers
      const newsRes = await fetch('/api/newsletter');
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.subscribers) setSubscribersCount(newsData.subscribers.length);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filter posts based on time filter
  const filteredPosts = useMemo(() => {
    if (timeFilter === 'all') return posts;
    const now = new Date();
    const days = timeFilter === '7d' ? 7 : 30;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return posts.filter(p => new Date(p.createdAt) >= cutoff);
  }, [posts, timeFilter]);

  // Analytics Computation
  const analytics = useMemo(() => {
    // Posts Analytics
    const totalPosts = filteredPosts.length;
    const publishedPosts = filteredPosts.filter(p => p.status === 'published').length;
    const draftPosts = filteredPosts.filter(p => p.status === 'draft').length;
    const featuredPosts = filteredPosts.filter(p => p.featured).length;
    const totalViews = filteredPosts.reduce((acc, p) => acc + (p.views || 0), 0);
    const avgViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
    const publishRate = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;

    // Categories Breakdown
    const catMap: Record<string, { count: number; views: number }> = {};
    filteredPosts.forEach(p => {
      const cat = p.category || 'General';
      if (!catMap[cat]) catMap[cat] = { count: 0, views: 0 };
      catMap[cat].count += 1;
      catMap[cat].views += (p.views || 0);
    });
    const sortedCategories = Object.entries(catMap)
      .map(([name, data]) => ({ name, count: data.count, views: data.views }))
      .sort((a, b) => b.count - a.count);

    // Top Viewed Posts Leaderboard
    const topPosts = [...filteredPosts]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 8);

    // Music Analytics
    const totalSongs = songs.length;
    const publishedSongs = songs.filter(s => s.status === 'Published' || !s.status).length;
    const pendingSongs = songs.filter(s => s.status === 'Pending').length;
    const totalPlays = songs.reduce((acc, s) => acc + (s.plays || 0), 0);
    const totalDownloads = songs.reduce((acc, s) => acc + (s.downloads || 0), 0);

    // Genre Distribution
    const genreMap: Record<string, number> = {};
    songs.forEach(s => {
      const g = s.genre || 'Afrobeats';
      genreMap[g] = (genreMap[g] || 0) + 1;
    });
    const sortedGenres = Object.entries(genreMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Top Songs
    const topSongs = [...songs]
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 5);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      featuredPosts,
      totalViews,
      avgViewsPerPost,
      publishRate,
      categories: sortedCategories,
      topPosts,
      totalSongs,
      publishedSongs,
      pendingSongs,
      totalPlays,
      totalDownloads,
      genres: sortedGenres,
      topSongs,
    };
  }, [filteredPosts, songs]);

  const isSubAdmin = session?.role === 'sub-admin';

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main" style={{ padding: isMobile ? '12px' : '24px' }}>
        {/* Top Header */}
        <div className="topbar" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: isMobile ? '18px' : '22px' }}>
              <BarChart3 size={24} /> Analytics Dashboard
              <span style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '20px',
                background: isSubAdmin ? 'rgba(99,88,255,0.15)' : 'rgba(255,107,0,0.15)',
                color: isSubAdmin ? '#6358FF' : '#FF6B00',
                fontWeight: 700,
                border: `1px solid ${isSubAdmin ? 'rgba(99,88,255,0.3)' : 'rgba(255,107,0,0.3)'}`
              }}>
                {isSubAdmin ? <><PenTool size={12} style={{ display: 'inline', marginBottom: '-2px' }}/> Sub-Admin</> : <><Crown size={12} style={{ display: 'inline', marginBottom: '-2px' }}/> Admin</>}
              </span>
            </div>
            <div className="admin-subtitle" style={{ fontSize: isMobile ? '11px' : '13px' }}>
              Real-time site metrics, audience traffic & content analytics.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: 'space-between' }}>
            {/* Time Filter Buttons */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.08)', flex: isMobile ? 1 : 'none', justifyContent: 'space-around' }}>
              {(['all', '30d', '7d'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  style={{
                    padding: isMobile ? '5px 8px' : '6px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    background: timeFilter === tf ? '#FF6B00' : 'transparent',
                    color: timeFilter === tf ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase'
                  }}
                >
                  {tf === 'all' ? 'All' : tf === '30d' ? '30 Days' : '7 Days'}
                </button>
              ))}
            </div>

            {/* Refresh Data Button */}
            <button
              onClick={loadDashboardData}
              disabled={loading}
              style={{
                padding: isMobile ? '6px 12px' : '9px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {loading ? '...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="post-manager" style={{ marginTop: '12px' }}>
          
          {/* KPI METRICS OVERVIEW (2 COLS ON MOBILE, 4 COLS ON DESKTOP) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: isMobile ? '10px' : '16px',
            marginBottom: isMobile ? '16px' : '24px'
          }}>
            {/* KPI 1: Articles */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '18px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Newspaper size={13} /> Articles
              </div>
              <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#fff', margin: '4px 0', fontFamily: '"Syne", sans-serif' }}>
                {formatNumber(analytics.totalPosts)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '10px' : '11px', flexWrap: 'wrap' }}>
                <span style={{ color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><Circle size={6} fill="#4ade80" /> {analytics.publishedPosts} Live</span>
                <span style={{ color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><Circle size={6} fill="#fbbf24" /> {analytics.draftPosts} Draft</span>
              </div>
            </div>

            {/* KPI 2: Total Views */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '18px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={13} /> Article Views
              </div>
              <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#fff', margin: '4px 0', fontFamily: '"Syne", sans-serif' }}>
                {formatNumber(analytics.totalViews)}
              </div>
              <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#FF6B00', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Zap size={11} /> Avg {formatNumber(analytics.avgViewsPerPost)} / post
              </div>
            </div>

            {/* KPI 3: Music Analytics */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '18px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Music size={13} /> Audio Catalog
              </div>
              <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#fff', margin: '4px 0', fontFamily: '"Syne", sans-serif' }}>
                {formatNumber(analytics.totalSongs)} <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>tracks</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '10px' : '11px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6358FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><Play size={10} fill="#6358FF" /> {formatNumber(analytics.totalPlays)}</span>
                <span style={{ color: '#1DBE73', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><Download size={10} /> {formatNumber(analytics.totalDownloads)}</span>
              </div>
            </div>

            {/* KPI 4: Reach & Subscribers */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '18px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} /> Audience
              </div>
              <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#fff', margin: '4px 0', fontFamily: '"Syne", sans-serif' }}>
                {formatNumber(subscribersCount)} <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>subs</span>
              </div>
              <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#00b4d8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Video size={11} /> {formatNumber(videosCount)} Videos
              </div>
            </div>
          </div>


          {/* ROW 1: CONTENT STATUS HEALTH & CATEGORY DISTRIBUTION */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
            gap: isMobile ? '12px' : '20px',
            marginBottom: isMobile ? '16px' : '24px'
          }}>
            {/* Card 1: System Content Status & Health */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: isMobile ? '14px' : '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings size={16} style={{ color: '#FF6B00' }} /> Publishing Status & Health
                </div>
                <div style={{ fontSize: '10px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  {analytics.publishRate}% Live
                </div>
              </div>

              {/* Articles Status Bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                  <span>Articles Live Ratio</span>
                  <span style={{ color: '#4ade80' }}>{analytics.publishedPosts} / {analytics.totalPosts}</span>
                </div>
                <div style={{ height: '8px', width: '100%', borderRadius: '4px', background: '#fbbf24', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ height: '100%', width: `${analytics.publishRate}%`, background: '#4ade80', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', color: 'rgba(255,255,255,0.4)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Circle size={6} fill="#4ade80" /> {analytics.publishedPosts} Live</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Circle size={6} fill="#fbbf24" /> {analytics.draftPosts} Drafts</span>
                </div>
              </div>

              {/* Songs Status Bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                  <span>Music Verification</span>
                  <span style={{ color: '#1DBE73' }}>{analytics.publishedSongs} / {analytics.totalSongs}</span>
                </div>
                {analytics.totalSongs > 0 ? (
                  <>
                    <div style={{ height: '8px', width: '100%', borderRadius: '4px', background: '#FF6B00', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ height: '100%', width: `${Math.round((analytics.publishedSongs / analytics.totalSongs) * 100)}%`, background: '#1DBE73', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', color: 'rgba(255,255,255,0.4)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Circle size={6} fill="#1DBE73" /> {analytics.publishedSongs} Verified</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Circle size={6} fill="#FF6B00" /> {analytics.pendingSongs} Pending</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>No songs</div>
                )}
              </div>

              {/* Featured Articles Ratio */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                  <span>Featured Articles</span>
                  <span style={{ color: '#FF6B00' }}>{analytics.featuredPosts}</span>
                </div>
                <div style={{ height: '8px', width: '100%', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ height: '100%', width: `${analytics.totalPosts > 0 ? Math.round((analytics.featuredPosts / analytics.totalPosts) * 100) : 0}%`, background: '#FF6B00', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>

            {/* Card 2: Article Category Distribution & Engagement */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: isMobile ? '14px' : '20px'
            }}>
              <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 800, color: '#fff', marginBottom: '14px', fontFamily: '"Syne", sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderOpen size={16} style={{ color: '#FF6B00' }} /> Categories & Views
              </div>

              {analytics.categories.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                  No posts categorized
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analytics.categories.slice(0, 5).map(cat => {
                    const pct = analytics.totalPosts > 0 ? Math.round((cat.count / analytics.totalPosts) * 100) : 0;
                    return (
                      <div key={cat.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fff', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 600 }}>{cat.name}</span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                            <strong style={{ color: '#FF6B00' }}>{cat.count}</strong> ({pct}%) • {formatNumber(cat.views)} views
                          </span>
                        </div>
                        <div style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #FF6B00, #ff8533)', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>


          {/* ROW 2: MUSIC & AUDIO ANALYTICS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
            gap: isMobile ? '12px' : '20px',
            marginBottom: isMobile ? '16px' : '24px'
          }}>
            {/* Music Genre Breakdown */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: isMobile ? '14px' : '20px'
            }}>
              <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 800, color: '#fff', marginBottom: '14px', fontFamily: '"Syne", sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Disc3 size={16} style={{ color: '#6358FF' }} /> Music Genres
              </div>

              {analytics.genres.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                  No music uploaded
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analytics.genres.map(g => {
                    const pct = analytics.totalSongs > 0 ? Math.round((g.count / analytics.totalSongs) * 100) : 0;
                    return (
                      <div key={g.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fff', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 600 }}>{g.name}</span>
                          <span style={{ fontSize: '10px', color: '#6358FF', fontWeight: 700 }}>{g.count} ({pct}%)</span>
                        </div>
                        <div style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6358FF, #887eff)', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top 5 Songs Leaderboard */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: isMobile ? '14px' : '20px'
            }}>
              <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 800, color: '#fff', marginBottom: '14px', fontFamily: '"Syne", sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Headphones size={16} style={{ color: '#6358FF' }} /> Top Played Tracks
              </div>

              {analytics.topSongs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                  No track plays
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analytics.topSongs.map((song, idx) => (
                    <div key={song._id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)',
                        color: idx <= 2 ? '#000' : '#fff',
                        fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>

                      <div style={{
                        width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0,
                        background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {!song.coverUrl && <Music size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {song.title}
                        </div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                          {song.artist}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                        <div style={{ color: '#6358FF', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}><Play size={10} fill="#6358FF" /> {formatNumber(song.plays || 0)}</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}><Download size={8} /> {formatNumber(song.downloads || 0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* FULL WIDTH: MOST VIEWED ARTICLES LEADERBOARD TABLE */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: isMobile ? '14px' : '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={18} style={{ color: '#FFD700' }} /> Top Articles Leaderboard
              </div>
              <Link href="/admin/posts" style={{ color: '#FF6B00', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                All Posts →
              </Link>
            </div>

            {loading || sessionLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                Loading analytics...
              </div>
            ) : analytics.topPosts.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                No articles published yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analytics.topPosts.map((post, idx) => {
                  const maxViews = analytics.topPosts[0]?.views || 1;
                  const viewPercentage = Math.min(100, Math.round(((post.views || 0) / maxViews) * 100));

                  return (
                    <div
                      key={post._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '14px',
                        padding: isMobile ? '8px 10px' : '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {/* Rank Badge */}
                      <div style={{
                        width: isMobile ? '22px' : '26px',
                        height: isMobile ? '22px' : '26px',
                        borderRadius: '6px',
                        background: idx === 0 ? '#FF6B00' : idx === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        fontSize: isMobile ? '10px' : '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        #{idx + 1}
                      </div>

                      {/* Post Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px',
                            background: 'rgba(255,107,0,0.12)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.25)',
                            textTransform: 'uppercase'
                          }}>
                            {post.category || 'General'}
                          </span>
                          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                            {timeAgo(post.updatedAt || post.createdAt)}
                          </span>
                        </div>

                        <div style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {post.title}
                        </div>
                      </div>

                      {/* Views Progress Bar & Tally */}
                      <div style={{ width: isMobile ? '90px' : '160px', flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 800, color: '#fff', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                          <Eye size={12} /> {formatNumber(post.views || 0)}
                        </div>
                        <div style={{ height: '4px', width: '100%', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${viewPercentage}%`, background: 'linear-gradient(90deg, #FF6B00, #ff8533)', borderRadius: '2px' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
