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
    const commentsEnabled = posts.filter((post) => post.allowComments).length;

    return { published, drafts, featured, commentsEnabled };
  }, [posts]);

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">
              {session?.role === 'sub-admin' ? 'Sub-admin Dashboard' : 'Dashboard'}
            </div>
            <div className="admin-subtitle">
              {session?.role === 'sub-admin'
                ? 'Your posting space with quick access to your own stories and account settings.'
                : 'A quick view of your current publishing activity.'}
            </div>
          </div>
          <div className="topbar-actions">
            <Link href="/admin" className="btn-draft" style={{ textDecoration: 'none' }}>
              New Post
            </Link>
            <Link href="/admin/posts" className="btn-publish" style={{ textDecoration: 'none' }}>
              {session?.role === 'sub-admin' ? 'My Posts' : 'All Posts'}
            </Link>
          </div>
        </div>

        <div className="post-manager">
          <div className="post-counts" style={{ marginTop: 0 }}>
            <div className="editor-metric">
              <span className="editor-metric-label">Total Posts</span>
              <strong>{formatNumber(posts.length)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">Published</span>
              <strong>{formatNumber(stats.published)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">Drafts</span>
              <strong>{formatNumber(stats.drafts)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">Featured</span>
              <strong>{formatNumber(stats.featured)}</strong>
            </div>
            <div className="editor-metric">
              <span className="editor-metric-label">Comments On</span>
              <strong>{formatNumber(stats.commentsEnabled)}</strong>
            </div>
          </div>

          <div className="post-manager-grid" style={{ marginTop: '16px' }}>
            <div className="post-list-card">
              <div className="side-title">Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <Link href="/admin" className="btn-publish" style={{ textDecoration: 'none', textAlign: 'center' }}>
                  Create a New Post
                </Link>
                <Link href="/admin/posts" className="btn-draft" style={{ textDecoration: 'none', textAlign: 'center' }}>
                  {session?.role === 'sub-admin' ? 'Manage My Posts' : 'Manage All Posts'}
                </Link>
                {session?.role === 'sub-admin' && (
                  <Link href="/admin/account" className="btn-draft" style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Change Password
                  </Link>
                )}
              </div>
            </div>

            <div className="post-list-card">
              <div className="side-title">Recent Posts</div>
              {loading || sessionLoading ? (
                <div className="post-empty-card" style={{ marginTop: '14px' }}>Loading your posts...</div>
              ) : posts.length === 0 ? (
                <div className="post-empty-card" style={{ marginTop: '14px' }}>
                  No posts yet. Start with your first story.
                </div>
              ) : (
                <div className="post-list">
                  {posts.slice(0, 8).map((post) => (
                    <Link key={post._id} href="/admin/posts" className="post-row" style={{ textDecoration: 'none' }}>
                      <div className="post-row-head">
                        <div className="post-row-title">{post.title}</div>
                        <div className={`post-badge ${post.status === 'draft' ? 'draft' : 'published'}`}>
                          {post.status}
                        </div>
                      </div>
                      <div className="post-row-meta">
                        <span>{timeAgo(post.updatedAt || post.createdAt)}</span>
                        {post.featured && <span>featured</span>}
                        {post.allowComments && <span>comments on</span>}
                      </div>
                      <div className="post-row-footer">
                        <span className="post-row-slug">/{post.slug}</span>
                        <div className="post-row-stats">
                          <span>{formatNumber(post.views || 0)} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
