'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  // Auto-check if already logged in
  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => {
        if (res.ok) {
          router.replace('/admin/dashboard');
        } else if (isMounted) {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        if (isMounted) setCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="login-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="login-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <img src="/images/jalaloadedlogo.png" alt="Jalaloaded Logo" style={{ height: '70px', width: 'auto', margin: '0 auto 16px auto', display: 'block' }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="login-spinner" style={{ width: '16px', height: '16px' }}></span>
            Checking admin session...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern"></div>

      <div className="login-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
          <img src="/images/jalaloadedlogo.png" alt="Jalaloaded Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <div className="login-subtitle">Admin Panel</div>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider-line"></div>
          <span className="login-divider-text">Sign In</span>
          <div className="login-divider-line"></div>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label className="login-label">Username</label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <input
                className="login-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                className="login-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="login-spinner"></span>
            ) : (
              <>
                Sign In
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secured with encrypted session tokens
        </div>
      </div>
    </div>
  );
}
