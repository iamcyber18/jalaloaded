'use client';

import { useState } from 'react';

export default function NewsletterBroadcastClient({ initialCount }: { initialCount: number }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setStatus('error');
      setMessage('Subject and body are required.');
      return;
    }

    if (!confirm(`Are you sure you want to email ${initialCount} subscribers?`)) return;

    setStatus('loading');
    
    // Convert newlines to <br/> for basic HTML formatting
    const htmlBody = body.replace(/\n/g, '<br/>');

    try {
      const res = await fetch('/api/newsletter/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html: htmlBody }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(`Success! Email broadcast sent to ${data.recipients} subscribers.`);
        setSubject('');
        setBody('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send broadcast.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred. Check your network or server logs.');
    }
  };

  return (
    <div className="admin-card">
      <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255, 107, 0, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 107, 0, 0.2)' }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--orange)' }}>Total Subscribers: {initialCount}</h2>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          Compose a message below. When you click Send, it will securely email all {initialCount} subscribers via BCC.
        </p>
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Email Subject</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. New Music Drop: Fireboy DML is back!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={status === 'loading'}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Message (Basic Text)</label>
          <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '-4px', marginBottom: '8px' }}>Line breaks will be preserved.</p>
          <textarea
            className="form-textarea"
            placeholder="Write your email content here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            disabled={status === 'loading'}
            required
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={status === 'loading' || initialCount === 0}
          >
            {status === 'loading' ? 'Sending Broadcast...' : 'Send Broadcast Now'}
          </button>

          {status === 'success' && <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: 'bold' }}>{message}</span>}
          {status === 'error' && <span style={{ color: '#ff4d4d', fontSize: '14px', fontWeight: 'bold' }}>{message}</span>}
        </div>
      </form>
    </div>
  );
}
