'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import PostMediaUploader from '@/components/PostMediaUploader';
import { IMediaItem } from '@/models/Post';

export default function AdminPage() {
  const [form, setForm] = useState({
    title: '',
    introduction: '',
    mainContent: '',
    conclusion: '',
    author: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin',
    category: 'General',
    tags: '',
    allowComments: true,
    featured: false,
  });

  const [media, setMedia] = useState<IMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagPills, setTagPills] = useState<string[]>([]);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const val = form.tags.trim().replace(/,$/, '');
      if (val && !tagPills.includes(val)) {
        setTagPills([...tagPills, val]);
      }
      setForm({ ...form, tags: '' });
    }
  };

  const removeTag = (tag: string) => {
    setTagPills(tagPills.filter(t => t !== tag));
  };

  // Merge structured sections into one body with markdown formatting
  const buildBody = () => {
    let body = '';
    if (form.introduction.trim()) {
      body += form.introduction.trim() + '\n\n';
    }
    if (form.mainContent.trim()) {
      body += form.mainContent.trim() + '\n\n';
    }
    if (form.conclusion.trim()) {
      body += '---\n\n' + form.conclusion.trim();
    }
    return body.trim();
  };

  const handleSubmit = async (status: 'published' | 'draft' = 'published') => {
    if (!form.title) {
      toast.error("Post title is required");
      return;
    }
    if (!form.introduction && !form.mainContent) {
      toast.error("Write at least an introduction or main content");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          body: buildBody(),
          introduction: form.introduction,
          mainContent: form.mainContent,
          conclusion: form.conclusion,
          author: form.author,
          category: form.category,
          allowComments: form.allowComments,
          tags: tagPills,
          media,
          status
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Post ${status === 'published' ? 'published' : 'saved as draft'}!`);
        setForm({ title: '', introduction: '', mainContent: '', conclusion: '', author: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin', category: 'General', tags: '', allowComments: true, featured: false });
        setMedia([]);
        setTagPills([]);
        window.open(`/blog/${data.slug}`, '_blank');
      } else {
        toast.error("Failed to create post.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['General', 'Music', 'Sports', 'Lifestyle', 'Politics', 'Entertainment', 'Fashion', 'News', 'Opinion', 'Events', 'Events'];

  return (
    <div className="jl">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <div className="logo-area">
          <div className="logo">JALALOADED</div>
          <div className="logo-sub">Admin Panel</div>
        </div>

        <div className="nav-section">Content</div>
        <div className="nav-item active"><div className="nav-dot"></div>New Post</div>
        <div className="nav-item"><div className="nav-dot"></div>All Posts</div>
        <div className="nav-item"><div className="nav-dot"></div>Music</div>
        <div className="nav-item"><div className="nav-dot"></div>Videos</div>

        <div className="nav-section">Manage</div>
        <div className="nav-item"><div className="nav-dot"></div>Media Library</div>
        <div className="nav-item"><div className="nav-dot"></div>Comments</div>
        <Link href="/admin/adverts" style={{ textDecoration: 'none' }}>
          <div className="nav-item"><div className="nav-dot"></div>Adverts</div>
        </Link>
        <div className="nav-item"><div className="nav-dot"></div>Settings</div>

        <div className="author-area">
          <div className="author-row">
            <div className="av">{form.author === 'jalal' ? 'JA' : 'CO'}</div>
            <div>
              <div className="av-name">{form.author === 'jalal' ? 'Jalal' : 'Co-friend'}</div>
              <div className="av-role">Author</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        <div className="topbar">
          <div className="page-title">Create New Post</div>
          <div className="topbar-actions">
            <button className="btn-draft" onClick={() => handleSubmit('draft')}>Save Draft</button>
            <button className="btn-publish" onClick={() => handleSubmit('published')} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </div>

        <div className="editor-area">
          {/* LEFT: EDITOR */}
          <div>
            {/* TITLE */}
            <div className="form-card">
              <div className="field-label">Post Title</div>
              <input
                className="field-title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Write your headline here..."
                maxLength={120}
              />
              <div className="char-count">{form.title.length}/120</div>
            </div>

            <div className="section-gap"></div>

            {/* INTRODUCTION */}
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div className="section-num">1</div>
                <div>
                  <div className="field-label" style={{ marginBottom: '0' }}>Introduction</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Hook your readers — set the scene or give a quick summary</div>
                </div>
              </div>
              <textarea
                className="field-body"
                value={form.introduction}
                onChange={e => setForm({ ...form, introduction: e.target.value })}
                placeholder="Start with something catchy... What's the story about? Why should people care?"
                style={{ minHeight: '100px' }}
              />
              <div className="char-count">{form.introduction.length} chars</div>
            </div>

            <div className="section-gap"></div>

            {/* MAIN CONTENT */}
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div className="section-num">2</div>
                <div>
                  <div className="field-label" style={{ marginBottom: '0' }}>Main Content</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>The full story — details, quotes, analysis, everything</div>
                </div>
              </div>
              <textarea
                className="field-body"
                value={form.mainContent}
                onChange={e => setForm({ ...form, mainContent: e.target.value })}
                placeholder="Write the full body of your post here... Go deep into the story, add details, quotes, and context. Markdown is supported."
                style={{ minHeight: '200px' }}
              />
              <div className="char-count">{form.mainContent.length} chars</div>
            </div>

            <div className="section-gap"></div>

            {/* CONCLUSION */}
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div className="section-num">3</div>
                <div>
                  <div className="field-label" style={{ marginBottom: '0' }}>Conclusion</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Wrap it up — final thoughts, call to action, or opinion</div>
                </div>
              </div>
              <textarea
                className="field-body"
                value={form.conclusion}
                onChange={e => setForm({ ...form, conclusion: e.target.value })}
                placeholder="End with a bang — your take, a question, or what's next..."
                style={{ minHeight: '80px' }}
              />
              <div className="char-count">{form.conclusion.length} chars</div>
            </div>

            <div className="section-gap"></div>

            {/* MEDIA SECTION */}
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '14px' }}>Photos &amp; Media</div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Upload images or add video URLs</span>
              </div>
              <PostMediaUploader media={media} onChange={setMedia} />
            </div>
          </div>

          {/* RIGHT: SIDEBAR PANELS */}
          <div>
            {/* Publish Settings */}
            <div className="side-card">
              <div className="side-title">Publish Settings</div>
              <div className="status-row">
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Allow comments</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={form.allowComments}
                    onChange={e => setForm({ ...form, allowComments: e.target.checked })}
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
                    checked={form.featured}
                    onChange={e => setForm({ ...form, featured: e.target.checked })}
                  />
                  <div className="toggle-track"></div>
                  <div className="toggle-thumb"></div>
                </label>
              </div>
            </div>

            {/* Category */}
            <div className="side-card">
              <div className="side-title">Category</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '10px' }}>Pick the topic that fits your post</div>
              <div className="cat-grid">
                {categories.map(c => (
                  <div
                    key={c}
                    className={`cat-chip ${form.category === c ? 'sel' : ''}`}
                    onClick={() => setForm({ ...form, category: c })}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Author */}
            <div className="side-card">
              <div className="side-title">Author</div>
              <div className="author-select">
                <div
                  className={`author-opt ${form.author === 'jalal' ? 'sel' : ''}`}
                  onClick={() => setForm({ ...form, author: 'jalal' })}
                >
                  <div className="av" style={{ width: '28px', height: '28px', fontSize: '10px', background: '#FF6B00', flexShrink: 0 }}>JA</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>Jalal</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Owner</div>
                  </div>
                  {form.author === 'jalal' && (
                    <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </div>
                <div
                  className={`author-opt ${form.author === 'co-friend' ? 'sel' : ''}`}
                  onClick={() => setForm({ ...form, author: 'co-friend' })}
                >
                  <div className="av" style={{ width: '28px', height: '28px', fontSize: '10px', background: 'rgba(255,107,0,0.2)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)', flexShrink: 0 }}>CO</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>Co-friend</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Co-author</div>
                  </div>
                  {form.author === 'co-friend' && (
                    <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="side-card">
              <div className="side-title">Tags</div>
              <input
                className="field-input"
                placeholder="Add tags, separated by commas"
                style={{ fontSize: '12px' }}
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                onKeyDown={handleTagKeyDown}
              />
              {tagPills.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {tagPills.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '20px',
                        background: 'rgba(255,107,0,0.12)', color: '#FF6B00',
                        fontSize: '11px', border: '0.5px solid rgba(255,107,0,0.3)'
                      }}
                    >
                      {tag}
                      <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => removeTag(tag)}>✕</span>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>Press comma or Enter to add</div>
            </div>

            {/* PREVIEW STRIP */}
            <div className="side-card">
              <div className="side-title">Post Preview</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px', marginBottom: '4px' }}>
                  {form.title || 'Untitled Post'}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="cat-chip sel" style={{ fontSize: '9px', padding: '2px 8px', cursor: 'default' }}>{form.category}</span>
                  <span>by {form.author === 'jalal' ? 'Jalal' : 'Co-friend'}</span>
                </div>
                <div style={{ opacity: 0.6 }}>
                  {form.introduction ? form.introduction.slice(0, 120) + (form.introduction.length > 120 ? '...' : '') : 'No introduction yet...'}
                </div>
                {(form.introduction || form.mainContent || form.conclusion) && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', gap: '12px' }}>
                    <span>📝 {[form.introduction, form.mainContent, form.conclusion].filter(Boolean).length}/3 sections</span>
                    <span>🏷️ {tagPills.length} tags</span>
                    <span>📸 {media.length} media</span>
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
