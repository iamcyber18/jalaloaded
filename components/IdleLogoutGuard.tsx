'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const WARNING_BEFORE_MS = 30 * 1000; // Show warning 30 seconds before logout

export default function IdleLogoutGuard() {
  const router = useRouter();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const performLogout = useCallback(async () => {
    // Clear all timers
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Even if the API call fails, redirect to login
    }
    router.push('/admin/login');
    router.refresh();
  }, [router]);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    // Hide warning if it was showing
    setShowWarning(false);
    setCountdown(30);

    // Set warning timer (fires 30s before logout)
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(30);

      // Start countdown
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Set logout timer
    idleTimer.current = setTimeout(() => {
      void performLogout();
    }, IDLE_TIMEOUT_MS);
  }, [performLogout]);

  useEffect(() => {
    // Activity events to track
    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'keypress',
      'touchstart',
      'scroll',
      'click',
    ];

    // Throttled activity handler (max once per second to avoid performance issues)
    let lastActivity = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 1000) return;
      lastActivity = now;
      resetTimers();
    };

    // Register all event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the initial timer
    resetTimers();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [resetTimers]);

  if (!showWarning) return null;

  return (
    <div className="idle-warning-overlay">
      <div className="idle-warning-card">
        <div className="idle-warning-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h3 className="idle-warning-title">Session Expiring</h3>
        <p className="idle-warning-text">
          You will be logged out in <strong>{countdown}s</strong> due to inactivity.
        </p>
        <div className="idle-warning-actions">
          <button
            className="idle-warning-btn idle-warning-btn-stay"
            onClick={resetTimers}
          >
            Stay Logged In
          </button>
          <button
            className="idle-warning-btn idle-warning-btn-logout"
            onClick={() => void performLogout()}
          >
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
