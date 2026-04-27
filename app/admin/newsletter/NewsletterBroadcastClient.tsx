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

    if (!confirm(`Are you sure you want to blast this email to ${initialCount} subscribers?`)) return;

    setStatus('loading');
    
    // Convert newlines to <br/> and add basic inline styles for email client compatibility
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #FF6B00; margin-bottom: 20px;">Jalaloaded Updates</h2>
        ${body.replace(/\n/g, '<br/>')}
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0 20px;" />
        <p style="font-size: 11px; color: #888;">
          You are receiving this because you subscribed to the Jalaloaded newsletter.
        </p>
      </div>
    `;

    try {
      const res = await fetch('/api/newsletter/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html: htmlBody }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(`Success! Email blast sent to ${data.recipients} subscribers.`);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Stat Card */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-background-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', gap: '20px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 107, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
          📧
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Total Active Subscribers</div>
          <div style={{ fontSize: '36px', fontFamily: '"Bebas Neue", sans-serif', color: 'var(--orange)', lineHeight: '1' }}>{initialCount}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Composer Form */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>Compose Broadcast</h3>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <label className="form-label">Message Body</label>
              <textarea
                className="form-textarea"
                placeholder="Write your email content here. Line breaks are automatically preserved."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                disabled={status === 'loading'}
                required
                style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', lineHeight: '1.6' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={status === 'loading' || initialCount === 0}
                style={{ padding: '12px 24px', fontSize: '14px', flexShrink: 0 }}
              >
                {status === 'loading' ? 'Sending...' : '🚀 Blast to All Subscribers'}
              </button>

              {status === 'success' && <div style={{ color: '#4ade80', fontSize: '13px', padding: '10px 16px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>{message}</div>}
              {status === 'error' && <div style={{ color: '#ff4d4d', fontSize: '13px', padding: '10px 16px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)' }}>{message}</div>}
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="admin-card" style={{ background: '#f5f5f5', color: '#333' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '12px', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Live Email Preview</span>
            <span>Desktop View</span>
          </h3>
          
          <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}><strong>From:</strong> Jalaloaded &lt;noreply@jalaloaded.com&gt;</div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}><strong>To:</strong> Subscribers (BCC)</div>
            <div style={{ fontSize: '16px', color: '#000', fontWeight: 'bold' }}>{subject || 'Subject will appear here...'}</div>
          </div>

          <div style={{ minHeight: '300px' }}>
            <h2 style={{ color: '#FF6B00', marginBottom: '20px', fontFamily: 'Arial, sans-serif' }}>Jalaloaded Updates</h2>
            
            <div 
              style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.6', color: '#333' }}
              dangerouslySetInnerHTML={{ __html: body ? body.replace(/\n/g, '<br/>') : '<span style="color: #aaa;">Your email body content will preview here...</span>' }}
            />
            
            <hr style={{ border: 'none', borderTop: '1px solid #eaeaea', margin: '30px 0 20px' }} />
            <p style={{ fontSize: '11px', color: '#888', fontFamily: 'Arial, sans-serif' }}>
              You are receiving this because you subscribed to the Jalaloaded newsletter.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
