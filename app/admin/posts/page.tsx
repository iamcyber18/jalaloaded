'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import PostMediaUploader from '@/components/PostMediaUploader';
import RichTextEditor from '@/components/RichTextEditor';
import { useAdminSession } from '@/components/useAdminSession';
import { IMediaItem } from '@/models/Post';
import { formatNumber, timeAgo } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Newspaper, Eye, RefreshCw, Pencil, Trash2, Save, FileText, Camera, Settings, Star, Circle, Zap, Search, Heart, X, CheckCircle, Sparkles } from 'lucide-react';

type PostStatusFilter = 'all' | 'published' | 'draft';
type PostStatus = 'published' | 'draft';

type AdminPost = {
  _id: string;
  title: string;
  slug: string;
  body?: string;
  introduction?: string;
  mainContent?: string;
  conclusion?: string;
  author: string;
  category: string;
  tags: string[];
  media: IMediaItem[];
  status: PostStatus;
  views: number;
  likes: number;
  allowComments: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

type EditorState = {
  title: string;
  introduction: string;
  mainContent: string;
  conclusion: string;
  author: string;
  category: string;
  status: PostStatus;
  allowComments: boolean;
  featured: boolean;
  tagInput: string;
};

const categories = ['General', 'Music', 'Sports', 'Lifestyle', 'Politics', 'Entertainment', 'Fashion', 'News', 'Opinion', 'Events', 'Business', 'Health and Wellbeing', 'Sciences', 'Technology'];

function buildBody(editor: EditorState) {
  const parts = [];
  if (editor.introduction.trim()) parts.push(editor.introduction.trim());
  if (editor.mainContent.trim()) parts.push(editor.mainContent.trim());
  if (editor.conclusion.trim()) parts.push(editor.conclusion.trim());
  return parts.join('\n\n---\n\n');
}

function getLegacySections(post: Pick<AdminPost, 'body' | 'introduction' | 'mainContent' | 'conclusion'>) {
  if (post.introduction || post.mainContent || post.conclusion) {
    return {
      introduction: post.introduction || '',
      mainContent: post.mainContent || '',
      conclusion: post.conclusion || '',
    };
  }

  const content = post.body?.trim() || '';
  if (!content) {
    return { introduction: '', mainContent: '', conclusion: '' };
  }

  const [beforeConclusion, ...conclusionParts] = content.split('\n---\n');
  const blocks = beforeConclusion.split(/\n\n+/).filter(Boolean);

  return {
    introduction: blocks.shift()?.trim() || '',
    mainContent: blocks.join('\n\n').trim(),
    conclusion: conclusionParts.join('\n---\n').trim(),
  };
}

export default function AdminPostsPage() {
  const { session, loading: sessionLoading } = useAdminSession();
  const defaultAuthor = session?.role === 'admin' ? 'cyber' : (session?.displayName || session?.username || 'Admin');

  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'settings'>('content');
  const [showPreview, setShowPreview] = useState(false);

  // Form Editor State
  const [editor, setEditor] = useState<EditorState>({
    title: '',
    introduction: '',
    mainContent: '',
    conclusion: '',
    author: defaultAuthor,
    category: 'General',
    status: 'published',
    allowComments: true,
    featured: false,
    tagInput: '',
  });
  const [media, setMedia] = useState<IMediaItem[]>([]);
  const [tagPills, setTagPills] = useState<string[]>([]);

  // Filtering & Search
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: '200',
      });
      if (query.trim()) params.set('q', query.trim());

      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setPosts(data.posts || []);
      } else {
        toast.error(data.error || 'Failed to load posts');
      }
    } catch {
      toast.error('Unable to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadPosts, 200);
    return () => clearTimeout(timeout);
  }, [query, statusFilter]);

  // Filter posts by category locally
  const filteredPosts = useMemo(() => {
    if (categoryFilter === 'all') return posts;
    return posts.filter(p => p.category === categoryFilter);
  }, [posts, categoryFilter]);

  // Open Edit Modal
  const handleOpenEdit = (post: AdminPost) => {
    setSelectedPost(post);
    const sections = getLegacySections(post);
    setEditor({
      title: post.title || '',
      introduction: sections.introduction,
      mainContent: sections.mainContent,
      conclusion: sections.conclusion,
      author: post.author || defaultAuthor,
      category: post.category || 'General',
      status: post.status || 'published',
      allowComments: post.allowComments ?? true,
      featured: Boolean(post.featured),
      tagInput: '',
    });
    setMedia([...(post.media || [])].sort((a, b) => a.order - b.order));
    setTagPills([...(post.tags || [])]);
    setActiveTab('content');
    setIsEditing(true);
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setIsEditing(false);
    setSelectedPost(null);
  };

  // Tag Handlers
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const value = editor.tagInput.trim().replace(/,$/, '');
      if (value && !tagPills.includes(value)) {
        setTagPills([...tagPills, value]);
      }
      setEditor({ ...editor, tagInput: '' });
    }
  };

  const removeTag = (tag: string) => {
    setTagPills(tagPills.filter(t => t !== tag));
  };

  // Save Post Changes
  const handleSave = async (overrideStatus?: PostStatus) => {
    if (!selectedPost) return;
    if (!editor.title.trim()) {
      toast.error('Post title is required');
      return;
    }
    if (!editor.introduction.trim() && !editor.mainContent.trim()) {
      toast.error('Write at least an introduction or main content');
      return;
    }

    setSaving(true);
    try {
      let finalTags = [...tagPills];
      if (editor.tagInput.trim()) {
        const leftover = editor.tagInput.split(',').map(t => t.trim()).filter(Boolean);
        finalTags = [...new Set([...finalTags, ...leftover])];
      }

      const postStatus = overrideStatus || editor.status;

      const res = await fetch(`/api/posts/${selectedPost._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editor.title,
          body: buildBody(editor),
          introduction: editor.introduction,
          mainContent: editor.mainContent,
          conclusion: editor.conclusion,
          author: editor.author,
          category: editor.category,
          status: postStatus,
          allowComments: editor.allowComments,
          featured: editor.featured,
          tags: finalTags,
          media,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update post');

      toast.success('Post updated successfully! ✨');
      setPosts(posts.map(p => p._id === selectedPost._id ? data.post : p));
      handleCloseEdit();
    } catch (err: any) {
      toast.error(err.message || 'Error saving post');
    } finally {
      setSaving(false);
    }
  };

  // Quick Status Toggle on Table Row
  const handleToggleStatus = async (post: AdminPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: PostStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      toast.success(newStatus === 'published' ? 'Post published! 🟢' : 'Moved to drafts 🟡');
      setPosts(posts.map(p => p._id === post._id ? { ...p, status: newStatus } : p));
    } catch {
      toast.error('Failed to change post status');
    }
  };

  // Delete Single Post
  const handleDeletePost = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');

      toast.success('Post deleted');
      setPosts(posts.filter(p => p._id !== id));
      setSelectedBulkIds(selectedBulkIds.filter(item => item !== id));
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk Selection Handlers
  const toggleBulkSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBulkIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBulkIds.length === filteredPosts.length) {
      setSelectedBulkIds([]);
    } else {
      setSelectedBulkIds(filteredPosts.map(p => p._id));
    }
  };

  const handleBulkAction = async (action: 'publish' | 'draft' | 'delete') => {
    if (selectedBulkIds.length === 0) return;
    const actionLabel = action === 'publish' ? 'publish' : action === 'draft' ? 'move to draft' : 'delete';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${selectedBulkIds.length} selected post(s)?`)) return;

    setBulkProcessing(true);
    try {
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedBulkIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk operation failed');

      toast.success(data.message || 'Bulk operation completed!');
      setSelectedBulkIds([]);
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || 'Bulk action failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const isSubAdmin = session?.role === 'sub-admin';
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main" style={{ padding: isMobile ? '12px' : '24px' }}>
        {/* Top bar */}
        <div className="topbar" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div>
            <div className="page-title" style={{ fontSize: isMobile ? '18px' : '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSubAdmin ? <><FileText size={20} /> My Articles</> : <><Newspaper size={20} /> Manage Articles</>}
            </div>
            <div className="admin-subtitle" style={{ fontSize: isMobile ? '11px' : '13px' }}>
              {isSubAdmin
                ? 'Manage, update, and review your authored articles.'
                : 'Search, filter, edit, publish, or bulk manage all articles.'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto', justifyContent: 'space-between' }}>
            <button onClick={loadPosts} className="btn-draft" style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <Link href="/admin" className="btn-publish" style={{ textDecoration: 'none', padding: '9px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Pencil size={13} /> Create New Post
            </Link>
          </div>
        </div>

        {/* Filters Bar & Stats Row */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
          padding: isMobile ? '12px' : '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between'
          }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : '240px', position: 'relative' }}>
              <input
                type="text"
                className="post-search"
                placeholder="Search titles, tags, content..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 36px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as PostStatusFilter)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Statuses ({posts.length})</option>
                <option value="published">Published ({publishedCount})</option>
                <option value="draft">Drafts ({draftCount})</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions Floating Bar */}
          {selectedBulkIds.length > 0 && (
            <div style={{
              padding: '10px 14px',
              marginTop: '12px',
              background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15), rgba(255, 107, 0, 0.05))',
              border: '1px solid rgba(255, 107, 0, 0.4)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={14} /> {selectedBulkIds.length} article(s) selected
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleBulkAction('publish')}
                  disabled={bulkProcessing}
                  style={{ background: '#4ade80', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Publish Selected
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('draft')}
                  disabled={bulkProcessing}
                  style={{ background: '#fbbf24', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Move to Drafts
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkProcessing}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* POSTS LIST / TABLE */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
          overflow: 'hidden'
        }}>
          {/* Table Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={filteredPosts.length > 0 && selectedBulkIds.length === filteredPosts.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer', accentColor: '#FF6B00', width: '15px', height: '15px' }}
              />
              <span>Article Details ({filteredPosts.length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {!isMobile && <span>Views & Activity</span>}
              <span>Actions</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              Loading articles...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              No articles found. Try adjusting your search query or filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredPosts.map((post) => {
                const coverPhoto = post.media?.find(m => m.type === 'photo')?.url;
                const isSelected = selectedBulkIds.includes(post._id);

                return (
                  <div
                    key={post._id}
                    onClick={() => handleOpenEdit(post)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: isMobile ? '12px' : '14px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? 'rgba(255,107,0,0.05)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Checkbox & Thumbnail & Title Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => toggleBulkSelect(post._id, e)}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', accentColor: '#FF6B00', width: '15px', height: '15px', flexShrink: 0 }}
                      />

                      {/* Thumbnail */}
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: coverPhoto ? `url(${coverPhoto}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,107,0,0.05))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {!coverPhoto && <Newspaper size={18} style={{ opacity: 0.5, color: '#fff' }} />}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                            background: 'rgba(255,107,0,0.12)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.25)',
                            textTransform: 'uppercase'
                          }}>
                            {post.category || 'General'}
                          </span>

                          <button
                            onClick={(e) => handleToggleStatus(post, e)}
                            style={{
                              fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                              background: post.status === 'published' ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)',
                              color: post.status === 'published' ? '#4ade80' : '#fbbf24',
                              display: 'flex', alignItems: 'center', gap: '3px'
                            }}
                          >
                            <Circle size={6} fill={post.status === 'published' ? '#4ade80' : '#fbbf24'} /> {post.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                          </button>

                          {post.featured && (
                            <span style={{ fontSize: '9px', color: '#FFD700', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Star size={10} fill="#FFD700" color="#FFD700" /> Featured
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {post.title}
                        </div>

                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                          by {post.author || 'Admin'} • {timeAgo(post.updatedAt || post.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', flexShrink: 0 }}>
                      {!isMobile && (
                        <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}><Eye size={12} /> <strong style={{ color: '#fff' }}>{formatNumber(post.views || 0)}</strong> views</div>
                          <div style={{ fontSize: '10px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}><Heart size={10} /> {formatNumber(post.likes || 0)} likes</div>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Live Link */}
                        {post.status === 'published' && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.05)',
                              color: 'rgba(255,255,255,0.8)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              fontSize: '11px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="View live post"
                          >
                            <Eye size={13} />
                          </Link>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(post); }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: 'rgba(255,107,0,0.1)',
                            color: '#FF6B00',
                            border: '1px solid rgba(255,107,0,0.25)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Pencil size={12} /> Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeletePost(post._id, post.title, e)}
                          disabled={deletingId === post._id}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.2)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Delete post"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FULL FEATURED EDIT MODAL OVERLAY */}
      {isEditing && selectedPost && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMobile ? '10px' : '20px'
        }} onClick={handleCloseEdit}>
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            background: '#121212',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pencil size={16} style={{ color: '#FF6B00' }} /> Edit Article: {selectedPost.title}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                  Slug: /{selectedPost.slug} • Last updated {timeAgo(selectedPost.updatedAt)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setShowPreview(true)}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Eye size={12} /> Preview
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#FF6B00', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCloseEdit}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '8px 20px',
              background: 'rgba(0,0,0,0.3)',
              borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
              {[
                { id: 'content', label: 'Article Content', icon: FileText },
                { id: 'media', label: `Photos & Media (${media.length})`, icon: Camera },
                { id: 'settings', label: 'Category & Settings', icon: Settings },
              ].map(t => {
                const IconComp = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === t.id ? 'rgba(255,107,0,0.15)' : 'transparent',
                      color: activeTab === t.id ? '#FF6B00' : 'rgba(255,255,255,0.5)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <IconComp size={13} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              
              {/* TAB 1: ARTICLE CONTENT */}
              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Title Field */}
                  <div className="form-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="field-label" style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Headline Title</div>
                    <input
                      className="field-title"
                      value={editor.title}
                      onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                      placeholder="Article headline..."
                      maxLength={120}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '15px', fontWeight: 700, outline: 'none' }}
                    />
                    <div className="char-count" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textAlign: 'right' }}>{editor.title.length}/120</div>
                  </div>

                  {/* Introduction */}
                  <RichTextEditor
                    label="Introduction (Hook)"
                    description="Set the scene or give a short catchy summary before the main body"
                    value={editor.introduction}
                    onChange={(val) => setEditor({ ...editor, introduction: val })}
                    placeholder="Write introduction..."
                    minHeight="120px"
                    sectionNum={1}
                  />

                  {/* Main Content */}
                  <RichTextEditor
                    label="Main Story Content"
                    description="The main article details, quotes, headings, and bullet points"
                    value={editor.mainContent}
                    onChange={(val) => setEditor({ ...editor, mainContent: val })}
                    placeholder="Write the main story body..."
                    minHeight="220px"
                    sectionNum={2}
                  />

                  {/* Conclusion */}
                  <RichTextEditor
                    label="Conclusion & Takeaways"
                    description="Final summary, thoughts, or opinion"
                    value={editor.conclusion}
                    onChange={(val) => setEditor({ ...editor, conclusion: val })}
                    placeholder="Closing thoughts..."
                    minHeight="100px"
                    sectionNum={3}
                  />
                </div>
              )}

              {/* TAB 2: MEDIA UPLOADER */}
              {activeTab === 'media' && (
                <div>
                  <PostMediaUploader media={media} onChange={setMedia} />
                </div>
              )}

              {/* TAB 3: CATEGORY & SETTINGS */}
              {activeTab === 'settings' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                  {/* Category Card */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Category Topic</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {categories.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setEditor({ ...editor, category: c })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: editor.category === c ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                            background: editor.category === c ? '#FF6B00' : 'rgba(255,255,255,0.04)',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags & Publishing Settings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Tags */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Article Tags</div>
                      <input
                        type="text"
                        placeholder="Add tags (press comma or enter)..."
                        value={editor.tagInput}
                        onChange={(e) => setEditor({ ...editor, tagInput: e.target.value })}
                        onKeyDown={handleTagKeyDown}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                      {tagPills.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {tagPills.map(tag => (
                            <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(255,107,0,0.15)', color: '#FF6B00', fontSize: '11px', border: '1px solid rgba(255,107,0,0.3)' }}>
                              {tag}
                              <span style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => removeTag(tag)}>✕</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Options */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Publish Options</div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Article Status</span>
                        <select
                          value={editor.status}
                          onChange={(e) => setEditor({ ...editor, status: e.target.value as PostStatus })}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '12px', fontWeight: 700 }}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Allow Reader Comments</span>
                        <input
                          type="checkbox"
                          checked={editor.allowComments}
                          onChange={e => setEditor({ ...editor, allowComments: e.target.checked })}
                          style={{ cursor: 'pointer', accentColor: '#FF6B00', width: '16px', height: '16px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Feature on Homepage</span>
                        <input
                          type="checkbox"
                          checked={editor.featured}
                          onChange={e => setEditor({ ...editor, featured: e.target.checked })}
                          style={{ cursor: 'pointer', accentColor: '#FF6B00', width: '16px', height: '16px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                Author: {editor.author || 'Admin'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCloseEdit}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FF6B00', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* POST PREVIEW MODAL */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', overflow: 'auto' }} onClick={() => setShowPreview(false)}>
          <div style={{ maxWidth: '700px', margin: '40px auto', background: '#121212', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,107,0,0.05)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={13} /> Article Preview</div>
              <button onClick={() => setShowPreview(false)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Close Preview</button>
            </div>

            <div style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{editor.category}</span>
              </div>
              <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '14px' }}>
                {editor.title || 'Untitled Article'}
              </h1>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.7' }}>
                {editor.introduction && <ReactMarkdown remarkPlugins={[remarkGfm]}>{editor.introduction}</ReactMarkdown>}
                {editor.mainContent && <ReactMarkdown remarkPlugins={[remarkGfm]}>{editor.mainContent}</ReactMarkdown>}
                {editor.conclusion && <ReactMarkdown remarkPlugins={[remarkGfm]}>{editor.conclusion}</ReactMarkdown>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
