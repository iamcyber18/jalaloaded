'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import PostMediaUploader from '@/components/PostMediaUploader';
import RichTextEditor from '@/components/RichTextEditor';
import { useAdminSession } from '@/components/useAdminSession';
import { IMediaItem } from '@/models/Post';
import { formatNumber, timeAgo } from '@/lib/utils';

type PostStatusFilter = 'all' | 'published' | 'draft';
type PostStatus = 'published' | 'draft';
type PostAuthor = string;

type AdminPost = {
  _id: string;
  title: string;
  slug: string;
  body?: string;
  introduction?: string;
  mainContent?: string;
  conclusion?: string;
  author: PostAuthor;
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
  author: PostAuthor;
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

function createEditorState(post: AdminPost) {
  const sections = getLegacySections(post);

  return {
    editor: {
      title: post.title || '',
      introduction: sections.introduction,
      mainContent: sections.mainContent,
      conclusion: sections.conclusion,
      author: post.author || 'jalal',
      category: post.category || 'General',
      status: post.status || 'published',
      allowComments: post.allowComments ?? true,
      featured: Boolean(post.featured),
      tagInput: '',
    },
    media: [...(post.media || [])].sort((a, b) => a.order - b.order),
    tags: [...(post.tags || [])],
  };
}

export default function AdminPostsPage() {
  const { session, loading: sessionLoading } = useAdminSession();
  const defaultAuthor = session?.role === 'admin' ? 'cyber' : (session?.displayName || session?.username || 'Admin');

  const emptyEditor: EditorState = {
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
  };
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [media, setMedia] = useState<IMediaItem[]>([]);
  const [tagPills, setTagPills] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>('all');
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const selectedIdRef = useRef<string | null>(null);

  const selectedPost = useMemo(
    () => posts.find((post) => post._id === selectedId) || null,
    [posts, selectedId]
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const hydrateFromPost = (post: AdminPost | null) => {
    if (!post) {
      setEditor(emptyEditor);
      setMedia([]);
      setTagPills([]);
      return;
    }

    const nextState = createEditorState(post);
    setEditor(nextState.editor);
    setMedia(nextState.media);
    setTagPills(nextState.tags);
  };

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          status: statusFilter,
          limit: '100',
        });

        if (query.trim()) {
          params.set('q', query.trim());
        }

        const res = await fetch(`/api/posts?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || 'Failed to load posts');
          setPosts([]);
          setSelectedId(null);
          hydrateFromPost(null);
          return;
        }

        const fetchedPosts = (data.posts || []) as AdminPost[];
        const preservedSelection =
          (selectedIdRef.current && fetchedPosts.find((post) => post._id === selectedIdRef.current)) ||
          fetchedPosts[0] ||
          null;

        setPosts(fetchedPosts);

        if (preservedSelection) {
          setSelectedId(preservedSelection._id);
          hydrateFromPost(preservedSelection);
        } else {
          setSelectedId(null);
          hydrateFromPost(null);
        }
      } catch {
        toast.error('Unable to load posts right now');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query, refreshToken, statusFilter]);

  const handleSelectPost = (post: AdminPost) => {
    setSelectedId(post._id);
    hydrateFromPost(post);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const value = editor.tagInput.trim().replace(/,$/, '');

      if (value && !tagPills.includes(value)) {
        setTagPills((current) => [...current, value]);
      }

      setEditor((current) => ({ ...current, tagInput: '' }));
    }
  };

  const removeTag = (tag: string) => {
    setTagPills((current) => current.filter((item) => item !== tag));
  };

  const handleSave = async () => {
    if (!selectedPost) {
      return;
    }

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
        const leftoverTags = editor.tagInput.split(',').map(t => t.trim()).filter(Boolean);
        finalTags = [...new Set([...finalTags, ...leftoverTags])];
      }

      const res = await fetch(`/api/posts/${selectedPost._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editor.title.trim(),
          body: buildBody(editor),
          introduction: editor.introduction,
          mainContent: editor.mainContent,
          conclusion: editor.conclusion,
          author: editor.author,
          category: editor.category,
          tags: finalTags,
          media,
          status: editor.status,
          allowComments: editor.allowComments,
          featured: editor.featured,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to update post');
        return;
      }

      const updatedPost = { ...selectedPost, ...data } as AdminPost;
      setPosts((current) =>
        current.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
      hydrateFromPost(updatedPost);
      setRefreshToken((current) => current + 1);
      toast.success('Post updated');
    } catch {
      toast.error('Something went wrong while updating the post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedPost.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/posts/${selectedPost._id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete post');
        return;
      }

      const currentIndex = posts.findIndex((post) => post._id === selectedPost._id);
      const nextPosts = posts.filter((post) => post._id !== selectedPost._id);
      const nextSelection =
        nextPosts[currentIndex] || nextPosts[currentIndex - 1] || nextPosts[0] || null;

      setPosts(nextPosts);

      if (nextSelection) {
        setSelectedId(nextSelection._id);
        hydrateFromPost(nextSelection);
      } else {
        setSelectedId(null);
        hydrateFromPost(null);
      }

      toast.success('Post deleted');
    } catch {
      toast.error('Something went wrong while deleting the post');
    } finally {
      setDeleting(false);
    }
  };

  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const toggleBulkSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBulkIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBulkIds.length === posts.length) {
      setSelectedBulkIds([]);
    } else {
      setSelectedBulkIds(posts.map(p => p._id));
    }
  };

  const handleBulkAction = async (action: 'publish' | 'draft' | 'delete') => {
    if (selectedBulkIds.length === 0) return;
    const actionLabel = action === 'publish' ? 'publish' : action === 'draft' ? 'set to draft' : 'delete';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${selectedBulkIds.length} selected post(s)?`)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedBulkIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk operation failed');

      toast.success(data.message || 'Bulk operation completed! 🚀');
      setSelectedBulkIds([]);
      setRefreshToken(current => current + 1);
    } catch (err: any) {
      toast.error(err.message || 'Bulk operation failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const publishedCount = posts.filter((post) => post.status === 'published').length;
  const draftCount = posts.filter((post) => post.status === 'draft').length;
  const isSubAdmin = session?.role === 'sub-admin';

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">{isSubAdmin ? 'My Posts' : 'All Posts'}</div>
            <div className="admin-subtitle">
              {isSubAdmin
                ? 'Review, update, and remove only the stories you have posted.'
                : 'Review drafts, update stories, and remove posts you no longer need.'}
            </div>
          </div>

          <div className="topbar-actions">
            <Link href="/admin" className="btn-draft" style={{ textDecoration: 'none' }}>
              New Post
            </Link>
            {selectedPost?.status === 'published' && (
              <Link
                href={`/blog/${selectedPost.slug}`}
                target="_blank"
                className="btn-draft"
                style={{ textDecoration: 'none' }}
              >
                View Live
              </Link>
            )}
            <button className="btn-draft" onClick={() => setRefreshToken((current) => current + 1)}>
              Refresh
            </button>
            <button className="admin-delete-btn" onClick={handleDelete} disabled={!selectedPost || deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button className="btn-publish" onClick={handleSave} disabled={!selectedPost || saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="post-manager">
          <div className="post-manager-grid">
            <div className="post-list-card">
              <div className="post-list-toolbar">
                <input
                  className="post-search"
                  placeholder="Search title, slug, tags..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                <select
                  className="post-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PostStatusFilter)}
                >
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>

              <div className="post-counts" style={{ alignItems: 'center' }}>
                <div className="editor-metric">
                  <span className="editor-metric-label">Loaded</span>
                  <strong>{posts.length}</strong>
                </div>
                <div className="editor-metric">
                  <span className="editor-metric-label">Published</span>
                  <strong>{publishedCount}</strong>
                </div>
                <div className="editor-metric">
                  <span className="editor-metric-label">Drafts</span>
                  <strong>{draftCount}</strong>
                </div>
                {posts.length > 0 && (
                  <button 
                    type="button" 
                    onClick={toggleSelectAll} 
                    className="btn-draft"
                    style={{ marginLeft: 'auto', fontSize: '11px', padding: '4px 8px' }}
                  >
                    {selectedBulkIds.length === posts.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {/* Bulk Actions Floating Bar */}
              {selectedBulkIds.length > 0 && (
                <div style={{
                  padding: '10px 14px',
                  margin: '12px 0',
                  background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15), rgba(255, 107, 0, 0.05))',
                  border: '1px solid rgba(255, 107, 0, 0.4)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FF6B00' }}>
                    {selectedBulkIds.length} selected
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      type="button" 
                      onClick={() => handleBulkAction('publish')} 
                      disabled={bulkProcessing}
                      style={{ background: '#4ade80', color: '#000', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Publish
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleBulkAction('draft')} 
                      disabled={bulkProcessing}
                      style={{ background: '#fbbf24', color: '#000', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Draft
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleBulkAction('delete')} 
                      disabled={bulkProcessing}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="post-empty-card">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="post-empty-card">No posts matched this filter.</div>
              ) : (
                <div className="post-list">
                  {posts.map((post) => (
                    <button
                      key={post._id}
                      className={`post-row ${post._id === selectedId ? 'active' : ''}`}
                      onClick={() => handleSelectPost(post)}
                      style={{ position: 'relative' }}
                    >
                      <div className="post-row-head" style={{ gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedBulkIds.includes(post._id)}
                          onClick={(e) => toggleBulkSelect(post._id, e)}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', accentColor: '#FF6B00', width: '15px', height: '15px', flexShrink: 0 }}
                        />
                        <div className="post-row-title" style={{ flex: 1 }}>{post.title}</div>
                        <div className={`post-badge ${post.status === 'draft' ? 'draft' : 'published'}`}>
                          {post.status}
                        </div>
                      </div>


                      <div className="post-row-meta">
                        <span>{post.category}</span>
                        <span>{post.author || 'Unknown author'}</span>
                        <span>{timeAgo(post.updatedAt || post.createdAt)}</span>
                      </div>

                      <div className="post-row-footer">
                        <span className="post-row-slug">/{post.slug}</span>
                        <div className="post-row-stats">
                          {post.featured && <span className="post-badge featured">Featured</span>}
                          <span>{formatNumber(post.views || 0)} views</span>
                          <span>{formatNumber(post.likes || 0)} likes</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="post-editor-stack">
              {!selectedPost ? (
                <div className="post-empty-card">Choose a post from the left to edit it.</div>
              ) : (
                <div className="post-editor-grid">
                  <div>
                    <div className="form-card">
                      <div className="field-label">Post Title</div>
                      <input
                        className="field-title"
                        value={editor.title}
                        onChange={(e) => setEditor((current) => ({ ...current, title: e.target.value }))}
                        placeholder="Write your headline here..."
                        maxLength={120}
                      />
                      <div className="char-count">{editor.title.length}/120</div>
                    </div>

                    <div className="section-gap"></div>

                    {/* INTRODUCTION */}
                    <RichTextEditor
                      label="Introduction"
                      description="Hook the reader before they dive in."
                      value={editor.introduction}
                      onChange={(val) => setEditor((current) => ({ ...current, introduction: val }))}
                      placeholder="Start with something catchy..."
                      minHeight="120px"
                      sectionNum={1}
                    />

                    <div className="section-gap"></div>

                    {/* MAIN CONTENT */}
                    <RichTextEditor
                      label="Main Content"
                      description="Keep the core article content here. Use toolbar for bold, bulleting, H2/H3 headings, subheadings, etc."
                      value={editor.mainContent}
                      onChange={(val) => setEditor((current) => ({ ...current, mainContent: val }))}
                      placeholder="Write the full body of your post here... Use the toolbar above to bold text, add bullet points, H2/H3 headings, sub-headings, quotes, and links."
                      minHeight="240px"
                      sectionNum={2}
                    />

                    <div className="section-gap"></div>

                    {/* CONCLUSION */}
                    <RichTextEditor
                      label="Conclusion"
                      description="Wrap up the story or add your closing take."
                      value={editor.conclusion}
                      onChange={(val) => setEditor((current) => ({ ...current, conclusion: val }))}
                      placeholder="End with a bang — your take, a question, or what's next..."
                      minHeight="100px"
                      sectionNum={3}
                    />

                    <div className="section-gap"></div>

                    <PostMediaUploader media={media} onChange={setMedia} />
                  </div>

                  <div>
                    <div className="side-card">
                      <div className="side-title">Post Snapshot</div>
                      <div className="editor-meta-grid">
                        <div className="editor-metric">
                          <span className="editor-metric-label">Created</span>
                          <strong>{timeAgo(selectedPost.createdAt)}</strong>
                        </div>
                        <div className="editor-metric">
                          <span className="editor-metric-label">Updated</span>
                          <strong>{timeAgo(selectedPost.updatedAt)}</strong>
                        </div>
                        <div className="editor-metric">
                          <span className="editor-metric-label">Views</span>
                          <strong>{formatNumber(selectedPost.views || 0)}</strong>
                        </div>
                        <div className="editor-metric">
                          <span className="editor-metric-label">Likes</span>
                          <strong>{formatNumber(selectedPost.likes || 0)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="side-card">
                      <div className="side-title">Publish Settings</div>
                      <div className="status-row">
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Allow comments</span>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={editor.allowComments}
                            onChange={(e) => setEditor((current) => ({ ...current, allowComments: e.target.checked }))}
                          />
                          <div className="toggle-track"></div>
                          <div className="toggle-thumb"></div>
                        </label>
                      </div>
                      <div className="status-row">
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Feature on homepage</span>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={editor.featured}
                            onChange={(e) => setEditor((current) => ({ ...current, featured: e.target.checked }))}
                          />
                          <div className="toggle-track"></div>
                          <div className="toggle-thumb"></div>
                        </label>
                      </div>
                      <div className="field-label" style={{ marginTop: '16px' }}>Status</div>
                      <select
                        className="field-select"
                        value={editor.status}
                        onChange={(e) => setEditor((current) => ({ ...current, status: e.target.value as PostStatus }))}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div className="side-card">
                      <div className="side-title">Category</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '10px' }}>Pick the topic that fits this post.</div>
                      <div className="cat-grid">
                        {categories.map((category) => (
                          <div
                            key={category}
                            className={`cat-chip ${editor.category === category ? 'sel' : ''}`}
                            onClick={() => setEditor((current) => ({ ...current, category }))}
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="side-card">
                      <div className="side-title">Tags</div>
                      <input
                        className="field-input"
                        placeholder="Add tags, separated by commas"
                        style={{ fontSize: '12px' }}
                        value={editor.tagInput}
                        onChange={(e) => setEditor((current) => ({ ...current, tagInput: e.target.value }))}
                        onKeyDown={handleTagKeyDown}
                      />
                      {tagPills.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {tagPills.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '20px',
                                background: 'rgba(255,107,0,0.12)',
                                color: '#FF6B00',
                                fontSize: '11px',
                                border: '0.5px solid rgba(255,107,0,0.3)',
                              }}
                            >
                              {tag}
                              <button
                                type="button"
                                style={{ cursor: 'pointer', opacity: 0.7, background: 'none', border: 'none', color: 'inherit', padding: 0 }}
                                onClick={() => removeTag(tag)}
                              >
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>Press comma or Enter to add</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
