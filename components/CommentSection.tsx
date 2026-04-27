'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { timeAgo } from '@/lib/utils';

interface CommentType {
  _id: string;
  name: string;
  body: string;
  likes: number;
  createdAt: string;
  replies?: CommentType[];
}

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      toast.error('Name and comment are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          parentId: parentId || undefined,
          name: name.trim(),
          body: body.trim(),
        }),
      });

      if (res.ok) {
        toast.success('Comment posted!');
        setName('');
        setBody('');
        setReplyingTo(null);
        await fetchComments();
      } else {
        toast.error('Failed to post comment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c._id === commentId) return { ...c, likes: (c.likes || 0) + 1 };
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map(r =>
            r._id === commentId ? { ...r, likes: (r.likes || 0) + 1 } : r
          ),
        };
      }
      return c;
    }));
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  // Generate avatar color based on name
  const getAvatarColor = (n: string) => {
    const colors = ['#FF6B00', '#E91E63', '#9C27B0', '#3F51B5', '#009688', '#FF5722', '#795548', '#607D8B'];
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <>
      {/* HEADER */}
      <div className="comments-hdr">
        <div className="comments-title">
          <div style={{ width: '22px', height: '3px', background: 'var(--orange)', borderRadius: '2px' }}></div>
          Comments
          <span className="comment-count-badge">{totalComments}</span>
        </div>
      </div>

      {/* COMMENT FORM */}
      <form onSubmit={(e) => handleSubmit(e)} className="comment-form">
        <div className="form-hdr">
          <div className="user-av">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: '"Syne", sans-serif', fontWeight: 600 }}>Join the conversation</span>
        </div>
        <div className="form-name-row">
          <input
            type="text"
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="cf-input"
            required
          />
          <input
            type="text"
            placeholder="Email (optional)"
            className="cf-input"
          />
        </div>
        <textarea
          placeholder="Write your comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="cf-textarea"
          required
        />
        <div className="cf-footer">
          <span className="cf-note">Be respectful. No spam.</span>
          <button type="submit" className="cf-submit" disabled={isSubmitting}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* COMMENT LIST */}
      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          No comments yet. Be the first to start the gist! 💬
        </div>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment._id} className="comment-item">
              <div className="comment-top">
                <div className="c-av" style={{ background: getAvatarColor(comment.name) }}>
                  {comment.name.charAt(0).toUpperCase()}
                </div>
                <div className="c-body">
                  <div className="c-name-row">
                    <span className="c-name">{comment.name}</span>
                    <span className="c-time">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <div className="c-text">{comment.body}</div>
                  <div className="c-actions">
                    <button className="c-action" onClick={() => handleLikeComment(comment._id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                      {comment.likes || 0}
                    </button>
                    <button
                      className="c-action"
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                      </svg>
                      Reply
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment._id && (
                    <form onSubmit={(e) => handleSubmit(e, comment._id)} style={{ marginTop: '12px' }}>
                      <input
                        type="text"
                        placeholder="Your name *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="cf-input"
                        style={{ marginBottom: '6px' }}
                        required
                      />
                      <textarea
                        placeholder="Write a reply..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="cf-textarea"
                        style={{ minHeight: '60px' }}
                        required
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="submit" className="cf-submit" disabled={isSubmitting} style={{ padding: '6px 14px', fontSize: '11px' }}>
                          {isSubmitting ? 'Posting...' : 'Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '0.5px solid var(--color-border-secondary)',
                            background: 'transparent',
                            color: 'var(--color-text-secondary)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontFamily: '"DM Sans", sans-serif',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="reply-thread">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="reply-item">
                          <div className="comment-top">
                            <div className="c-av" style={{ background: getAvatarColor(reply.name), width: '28px', height: '28px', fontSize: '10px' }}>
                              {reply.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="c-body">
                              <div className="c-name-row">
                                <span className="c-name" style={{ fontSize: '12px' }}>{reply.name}</span>
                                <span className="c-time">{timeAgo(reply.createdAt)}</span>
                              </div>
                              <div className="c-text" style={{ fontSize: '12px' }}>{reply.body}</div>
                              <div className="c-actions">
                                <button className="c-action" onClick={() => handleLikeComment(reply._id)}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                                  </svg>
                                  {reply.likes || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
