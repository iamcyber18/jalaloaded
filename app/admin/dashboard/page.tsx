'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';
import { formatNumber, timeAgo } from '@/lib/utils';

type DashboardPost = {
  _id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  featured?: boolean;
  allowComments?: boolean;
  views?: number;
  createdAt: string;
  updatedAt: string;
};

type DashboardStats = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  featuredPosts: number;
  totalViews: number;
  recentActivity: number;
};

export default function AdminDashboardPage() {
  const { session, loading: sessionLoading } = useAdminSession();
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetch('/api/posts?status=all&limit=50');
        const data = await res.json();

        if (res.ok) {
          setPosts(data.posts || []);
        } else {
          setPosts([]);
        }
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.status === 'published').length;
    const drafts = posts.filter((post) => post.status === 'draft').length;
    const featured = posts.filter((post) => post.featured).length;
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
    
    // Recent activity (posts created/updated in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentActivity = posts.filter(post => 
      new Date(post.updatedAt || post.createdAt) > weekAgo
    ).length;

    return { 
      totalPosts: posts.length,
      publishedPosts: published, 
      draftPosts: drafts, 
      featuredPosts: featured,
      totalViews,
      recentActivity
    };
  }, [posts]);

  const isSubAdmin = session?.role === 'sub-admin';

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">
              Welcome back, {session?.displayName || session?.username || 'Admin'}!
            </div>
            <div className="admin-subtitle">
              {isSubAdmin 
                ? 'Your content dashboard - manage your posts and account settings.'
                : 'Your admin dashboard - overview of all site content and management tools.'}
            </div>
          </div>
          <div className="topbar-actions">
            <Link href="/admin" className="btn-publish" style={{ textDecoration: 'none' }}>
              ✏️ Create New Post
            </Link>
          </div>
        </div>

        <div className="post-manager">
          {/* Stats Overview */}
          <div className="post-counts" style={{ marginTop: 0, marginBottom: '24px' }}>
            <div className="editor-metric">
              <span className="editor-metric-label">Total Posts</span>
              <strong>{formatNumber(stats.totalPosts)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">Published</span>
              <strong style={{ color: '#4ade80' }}>{formatNumber(stats.publishedPosts)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">Drafts</span>
              <strong style={{ color: '#fbbf24' }}>{formatNumber(stats.draftPosts)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">Featured</span>
              <strong style={{ color: '#FF6B00' }}>{formatNumber(stats.featuredPosts)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">Total Views</span>
              <strong>{formatNumber(stats.totalViews)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">This Week</span>
              <strong style={{ color: '#8b5cf6' }}>{formatNumber(stats.recentActivity)}</strong>
            </div>
          </div>

          <div className="post-manager-grid">
            {/* Quick Actions */}
            <div className="post-list-card">
              <div className="side-title">🚀 Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <Link href="/admin" className="btn-publish" style={{ textDecoration: 'none', textAlign: 'center', padding: '12px' }}>
                  ✏️ Create New Post
                </Link>
                <Link href="/admin/posts" className="btn-draft" style={{ textDecoration: 'none', textAlign: 'center', padding: '12px' }}>
                  📝 {isSubAdmin ? 'Manage My Posts' : 'Manage All Posts'}
                </Link>
                
                {!isSubAdmin && (
                  <>
                    <Link href="/admin/music" className="btn-draft" style={{ textDecoration: 'none', textAlign: 'center', padding: '12px' }}>
                      🎵 Manage Music
                    </Link>
                    <Link href="/admin/artists" className="btn-draft" style={{ textDecoration: 'none', textAlign: 'center', padding: '12px' }}>
                      🎤 Manage Artists
                    </Link>
                    <Link href="/admin/newsletter" className="btn-draft" style={{ textDecoration: 'none', textAlign: 'center', padding: '12px' }}>
                      📧 Newsletter
                    </Link>
                    <Link href="/admin/users" className="btn-draft" style={{ textDecoration: 'none', textAlign: 'center', padding: '12px' }}>
                      👥 Sub Admins
                    </Link>
                  </>
                )}
                
                {isSubAdmin && (
                  <Link href="/admin/account" className="btn-draft" style={{ textDecoration: 'none', textAlign: 'center', padding: '12px' }}>
                    🔐 Change Password
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Posts */}
            <div className="post-list-card">
              <div className="side-title">📰 Recent Posts</div>
              {loading || sessionLoading ? (
                <div className="post-empty-card" style={{ marginTop: '14px' }}>Loading your posts...</div>
              ) : posts.length === 0 ? (
                <div className="post-empty-card" style={{ marginTop: '14px' }}>
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>No posts yet</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Start creating your first story</div>
                    <Link href="/admin" className="btn-publish" style={{ textDecoration: 'none', fontSize: '12px', padding: '8px 16px' }}>
                      Create First Post
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="post-list">
                  {posts.slice(0, 8).map((post) => (
                    <Link key={post._id} href="/admin/posts" className="post-row" style={{ textDecoration: 'none' }}>
                      <div className="post-row-head">
                        <div className="post-row-title">{post.title}</div>
                        <div className={`post-badge ${post.status === 'draft' ? 'draft' : 'published'}`}>
                          {post.status === 'draft' ? '📝' : '✅'} {post.status}
                        </div>
                      </div>
                      <div className="post-row-meta">
                        <span>📅 {timeAgo(post.updatedAt || post.createdAt)}</span>
                        {post.featured && <span>⭐ featured</span>}
                        {post.allowComments && <span>💬 comments on</span>}
                      </div>
                      <div className="post-row-footer">
                        <span className="post-row-slug">/{post.slug}</span>
                        <div className="post-row-stats">
                          <span>👁️ {formatNumber(post.views || 0)} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {posts.length > 8 && (
                    <Link href="/admin/posts" className="post-row" style={{ textDecoration: 'none', opacity: 0.7, borderStyle: 'dashed' }}>
                      <div style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        View all {posts.length} posts →
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* System Status & Tips */}
            <div className="post-list-card">
              <div className="side-title">💡 Tips & Status</div>
              <div style={{ marginTop: '16px', fontSize: '12px', lineHeight: '1.6' }}>
                <div style={{ padding: '12px', background: 'rgba(75, 222, 128, 0.1)', border: '1px solid rgba(75, 222, 128, 0.2)', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#4ade80', marginBottom: '4px' }}>✅ System Status: Online</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)' }}>All systems operational</div>
                </div>
                
                <div style={{ padding: '12px', background: 'rgba(255, 107, 0, 0.1)', border: '1px solid rgba(255, 107, 0, 0.2)', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#FF6B00', marginBottom: '8px' }}>💡 Quick Tips</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', color: 'rgba(255,255,255,0.7)' }}>
                    <li>Use featured posts to highlight important content</li>
                    <li>Add tags to improve content discoverability</li>
                    <li>Preview posts before publishing</li>
                    {!isSubAdmin && <li>Check newsletter subscribers regularly</li>}
                  </ul>
                </div>

                {stats.draftPosts > 0 && (
                  <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '4px' }}>📝 {stats.draftPosts} Draft{stats.draftPosts > 1 ? 's' : ''} Pending</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)' }}>Don't forget to publish your draft posts</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
