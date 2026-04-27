'use client';

import { useState } from 'react';

export default function NewsletterForm({ isSidebar = false }: { isSidebar?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Subscribed successfully!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
      <div style={{ display: 'flex', flexDirection: isSidebar ? 'column' : 'row', gap: '8px', width: '100%' }}>
        <input
          type="email"
          className="nl-input"
          placeholder="Enter your email address..."
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          disabled={status === 'loading' || status === 'success'}
          required
          style={{ flex: 1, width: isSidebar ? '100%' : 'auto', marginBottom: 0 }}
        />
        <button 
          type="submit" 
          className="nl-btn"
          disabled={status === 'loading' || status === 'success'}
          style={{ width: isSidebar ? '100%' : 'auto', padding: '9px 16px', whiteSpace: 'nowrap' }}
        >
          {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed ✓' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && <div style={{ fontSize: '12px', color: '#ff4d4d', marginTop: '4px', textAlign: 'left' }}>{message}</div>}
      {status === 'success' && <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '4px', textAlign: 'left' }}>{message}</div>}
    </form>
  );
}
