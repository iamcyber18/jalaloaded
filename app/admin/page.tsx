'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AdminSidebar from '@/components/AdminSidebar';
import PostMediaUploader from '@/components/PostMediaUploader';
import RichTextEditor from '@/components/RichTextEditor';
import { useAdminSession } from '@/components/useAdminSession';
import { IMediaItem } from '@/models/Post';
import { FilePenLine, ImagePlus, MessageSquare, Save, Tags } from 'lucide-react';
import { preprocessMarkdown } from '@/lib/utils';

export default function AdminPage() {
  const [form, setForm] = useState({
    title: '',
    introduction: '',
    mainContent: '',
    conclusion: '',
    author: '',
    category: 'General',
    tags: '',
    allowComments: true,
    featured: false,
  });

  const [media, setMedia] = useState<IMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagPills, setTagPills] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { session } = useAdminSession();
  const activeAuthor = session?.role === 'admin' ? 'cyber' : (session?.displayName || session?.username || form.author || 'Admin');

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
    const parts = [];
    if (form.introduction.trim()) parts.push(form.introduction.trim());
    if (form.mainContent.trim()) parts.push(form.mainContent.trim());
    if (form.conclusion.trim()) parts.push(form.conclusion.trim());
    return parts.join('\n\n---\n\n');
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
      let finalTags = [...tagPills];
      if (form.tags.trim()) {
        const leftoverTags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
        finalTags = [...new Set([...finalTags, ...leftoverTags])];
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          body: buildBody(),
          introduction: form.introduction,
          mainContent: form.mainContent,
          conclusion: form.conclusion,
          author: activeAuthor,
          category: form.category,
          allowComments: form.allowComments,
          featured: form.featured,
          tags: finalTags,
          media,
          status
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Post ${status === 'published' ? 'published' : 'saved as draft'}!`);
        setForm({
          title: '',
          introduction: '',
          mainContent: '',
          conclusion: '',
          author: '',
          category: 'General',
          tags: '',
          allowComments: true,
          featured: false,
        });
        setMedia([]);
        setTagPills([]);
        window.open(`/blog/${data.slug}`, '_blank');
      } else {
        toast.error("Failed to create post.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['General', 'Music', 'Sports', 'Lifestyle', 'Politics', 'Entertainment', 'Fashion', 'News', 'Opinion', 'Events', 'Business', 'Health and Wellbeing', 'Sciences', 'Technology'];
  const completedSections = [form.introduction, form.mainContent, form.conclusion].filter(Boolean).length;
  const wordCount = buildBody().trim() ? buildBody().trim().split(/\s+/).length : 0;

  return (
    <div className="jl">
      <AdminSidebar />

      {/* MAIN */}
      <div className="main">
        <div className="post-editor-shell">
        <div className="topbar post-editor-header">
          <div>
            <div className="post-editor-eyebrow"><FilePenLine size={14} /> Editorial workspace</div>
            <h1>Create a new post</h1>
            <p>Build your story, organise its settings, then publish when it is ready.</p>
          </div>
          <div className="topbar-actions post-editor-actions">
            <button className="btn-draft" onClick={() => setShowPreview(true)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>👁️ Preview</button>
            <button className="btn-draft post-editor-secondary-action" onClick={() => handleSubmit('draft')}><Save size={15} /> Save draft</button>
            <button className="btn-publish post-editor-primary-action" onClick={() => handleSubmit('published')} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </div>

        <section className="post-editor-overview" aria-label="Post progress">
          <div><span className="post-editor-overview-icon"><FilePenLine size={16} /></span><strong>{completedSections}/3</strong><span>Sections written</span></div>
          <div><span className="post-editor-overview-icon media"><ImagePlus size={16} /></span><strong>{media.length}</strong><span>Media items</span></div>
          <div><span className="post-editor-overview-icon tags"><Tags size={16} /></span><strong>{tagPills.length}</strong><span>Tags added</span></div>
          <div><span className="post-editor-overview-icon words"><MessageSquare size={16} /></span><strong>{wordCount.toLocaleString()}</strong><span>Words written</span></div>
        </section>

        <div className="editor-area post-editor-layout">
          {/* LEFT: EDITOR */}
          <div className="post-editor-canvas">
            {/* TITLE */}
            <div className="form-card post-title-card">
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

            <section className="post-media-section"><PostMediaUploader media={media} onChange={setMedia} /></section>

            <div className="section-gap"></div>

            {/* INTRODUCTION */}
            <RichTextEditor
              label="Introduction"
              description="Hook your readers — set the scene or give a quick summary"
              value={form.introduction}
              onChange={(val) => setForm({ ...form, introduction: val })}
              placeholder="Start with something catchy... What's the story about? Why should people care?"
              minHeight="120px"
              sectionNum={1}
            />

            <div className="section-gap"></div>

            {/* MAIN CONTENT */}
            <RichTextEditor
              label="Main Content"
              description="The full story — details, quotes, analysis, headings, bullet points"
              value={form.mainContent}
              onChange={(val) => setForm({ ...form, mainContent: val })}
              placeholder="Write the full body of your post here... Use the toolbar above to bold text, add bullet points, H2/H3 headings, sub-headings, quotes, and links."
              minHeight="240px"
              sectionNum={2}
            />

            <div className="section-gap"></div>

            {/* CONCLUSION */}
            <RichTextEditor
              label="Conclusion"
              description="Wrap it up — final thoughts, call to action, or opinion"
              value={form.conclusion}
              onChange={(val) => setForm({ ...form, conclusion: val })}
              placeholder="End with a bang — your take, a question, or what's next..."
              minHeight="100px"
              sectionNum={3}
            />
          </div>

          {/* RIGHT: SIDEBAR PANELS */}
          <aside className="post-editor-settings">
            {/* Publish Settings */}
            <div className="side-card post-settings-card">
              <div className="post-settings-kicker">Publishing</div>
              <div className="side-title">Visibility & discussion</div>
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
            <div className="side-card post-settings-card">
              <div className="post-settings-kicker">Organisation</div>
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

            {/* Tags */}
            <div className="side-card post-settings-card">
              <div className="post-settings-kicker">Discoverability</div>
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
            <div className="side-card post-preview-card">
              <div className="post-settings-kicker">At a glance</div>
              <div className="side-title">Post preview</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px', marginBottom: '4px' }}>
                  {form.title || 'Untitled Post'}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="cat-chip sel" style={{ fontSize: '9px', padding: '2px 8px', cursor: 'default' }}>{form.category}</span>
                  <span>by {activeAuthor || 'Unknown author'}</span>
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
          </aside>
        </div>
        </div>
      </div>
      {/* POST PREVIEW MODAL */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', overflow: 'auto' }} onClick={() => setShowPreview(false)}>
          <div style={{ maxWidth: '700px', margin: '40px auto', background: 'var(--color-background)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,107,0,0.05)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B00' }}>👁️ Post Preview</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowPreview(false); handleSubmit('draft'); }} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Save Draft</button>
                <button onClick={() => { setShowPreview(false); handleSubmit('published'); }} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#FF6B00', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Publish</button>
                <button onClick={() => setShowPreview(false)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontSize: '14px', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            {/* Cover Photos */}
            {(() => {
              const coverPhotos = media.filter(m => m.type === 'photo' && (!m.position || m.position === 'cover'));
              if (coverPhotos.length === 0) return null;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: coverPhotos.length === 1 ? '1fr' : '1fr 1fr', gridTemplateRows: coverPhotos.length <= 2 ? '280px' : '160px 160px', gap: '4px' }}>
                  {coverPhotos.map((p, i) => (
                    <div key={i} style={coverPhotos.length === 3 && i === 0 ? { gridRow: 'span 2', overflow: 'hidden' } : { overflow: 'hidden' }}>
                      <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Article Content */}
            <div style={{ padding: '24px 20px' }}>
              {/* Category & Meta */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{form.category}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Just now</span>
              </div>

              {/* Title */}
              <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '14px' }}>
                {form.title || 'Untitled Post'}
              </h1>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B00, #ff9248)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  {(activeAuthor || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{activeAuthor}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Writer • Jalaloaded</div>
                </div>
              </div>

              {/* Body */}
              <div className="article-body">
                {form.introduction && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ em: ({children}: any) => <em style={{ fontStyle: 'italic' }}>{children}</em>, i: ({children}: any) => <i style={{ fontStyle: 'italic' }}>{children}</i> }}>
                    {preprocessMarkdown(form.introduction)}
                  </ReactMarkdown>
                )}

                {/* After-intro images */}
                {media.filter(m => m.type === 'photo' && m.position === 'after-intro').map((p, i) => (
                  <div key={`ai-${i}`} style={{ margin: '20px 0', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                    <img src={p.url} alt="" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}

                {form.mainContent && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ em: ({children}: any) => <em style={{ fontStyle: 'italic' }}>{children}</em>, i: ({children}: any) => <i style={{ fontStyle: 'italic' }}>{children}</i> }}>
                    {preprocessMarkdown(form.mainContent)}
                  </ReactMarkdown>
                )}

                {/* After-main images */}
                {media.filter(m => m.type === 'photo' && m.position === 'after-main').map((p, i) => (
                  <div key={`am-${i}`} style={{ margin: '20px 0', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                    <img src={p.url} alt="" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}

                {form.conclusion && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ em: ({children}: any) => <em style={{ fontStyle: 'italic' }}>{children}</em>, i: ({children}: any) => <i style={{ fontStyle: 'italic' }}>{children}</i> }}>
                      {preprocessMarkdown(form.conclusion)}
                    </ReactMarkdown>
                  </>
                )}

                {/* After-conclusion images */}
                {media.filter(m => m.type === 'photo' && m.position === 'after-conclusion').map((p, i) => (
                  <div key={`ac-${i}`} style={{ margin: '20px 0', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                    <img src={p.url} alt="" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>

              {/* Tags */}
              {tagPills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {tagPills.map(tag => (
                    <span key={tag} style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
