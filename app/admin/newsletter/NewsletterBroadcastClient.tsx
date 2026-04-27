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
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://jalaloaded.vercel.app/images/jalaloadedlogo.png" alt="Jalaloaded Logo" style="height: 60px; width: auto; max-width: 100%;" />
        </div>
        ${body.replace(/\n/g, '<br/>')}
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0 20px;" />
        <p style="font-size: 11px; color: #888; text-align: center;">
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

  const inputStyle = {
    width: '100%',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px' }}>
      
      {/* Stat Card */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-background-secondary, #1a1a1a)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', gap: '20px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 107, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
          📧
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary, #888)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Total Active Subscribers</div>
          <div style={{ fontSize: '36px', fontFamily: '"Bebas Neue", sans-serif', color: 'var(--orange, #FF6B00)', lineHeight: '1' }}>{initialCount}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'start' }}>
        
        {/* Composer Form */}
        <div style={{ flex: '1 1 400px', background: 'var(--color-background-secondary, #1a1a1a)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', color: '#fff' }}>Compose Broadcast</h3>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Email Subject</label>
              <input
                type="text"
                placeholder="e.g. New Music Drop: Fireboy DML is back!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={status === 'loading'}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Message Body</label>
              <p style={{ fontSize: '11px', color: '#888', marginTop: '-4px', marginBottom: '8px' }}>Line breaks will be preserved.</p>
              <textarea
                placeholder="Write your email content here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                disabled={status === 'loading'}
                required
                style={{ ...inputStyle, resize: 'vertical', minHeight: '150px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <button 
                type="submit" 
                disabled={status === 'loading' || initialCount === 0}
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '14px', 
                  background: 'var(--orange, #FF6B00)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: (status === 'loading' || initialCount === 0) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: (status === 'loading' || initialCount === 0) ? 0.7 : 1
                }}
              >
                {status === 'loading' ? 'Sending...' : '🚀 Blast to All Subscribers'}
              </button>
            </div>
            
            {status === 'success' && <div style={{ color: '#4ade80', fontSize: '14px', padding: '12px 16px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)', marginTop: '8px' }}>{message}</div>}
            {status === 'error' && <div style={{ color: '#ff4d4d', fontSize: '14px', padding: '12px 16px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)', marginTop: '8px' }}>{message}</div>}
          </form>
        </div>

        {/* Live Preview */}
        <div style={{ flex: '1 1 400px', background: '#f5f5f5', color: '#333', padding: '24px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
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
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/jalaloadedlogo.png" alt="Jalaloaded Logo" style={{ height: '60px', width: 'auto', maxWidth: '100%' }} />
            </div>
            
            <div 
              style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.6', color: '#333' }}
              dangerouslySetInnerHTML={{ __html: body ? body.replace(/\n/g, '<br/>') : '<span style="color: #aaa;">Your email body content will preview here...</span>' }}
            />
            
            <hr style={{ border: 'none', borderTop: '1px solid #eaeaea', margin: '30px 0 20px' }} />
            <p style={{ fontSize: '11px', color: '#888', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
              You are receiving this because you subscribed to the Jalaloaded newsletter.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
