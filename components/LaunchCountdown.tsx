'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAdminSession } from './useAdminSession';
import { usePathname } from 'next/navigation';

export default function LaunchCountdown() {
  const { session, loading: sessionLoading } = useAdminSession();
  const pathname = usePathname();
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isLaunched, setIsLaunched] = useState(false);

  // Set the launch time: May 3, 2026, at 12:00 PM
  const LAUNCH_DATE = new Date('2026-05-03T12:00:00+01:00').getTime();

  // Bypass ONLY for admin dashboard paths
  const isAdminPath = pathname?.startsWith('/admin');
  const shouldBypass = isAdminPath;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE - now;

      if (distance <= 0) {
        clearInterval(timer);
        setIsLaunched(true);
      } else {
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ d, h, m, s } as any);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLaunched || shouldBypass) return null;

  return (
    <div className="launch-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#0a0a0a',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: '#fff',
      fontFamily: '"DM Sans", sans-serif',
      padding: '20px'
    }}>
      {/* Background Glow */}
      <div className="glow-bg" style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%)',
        zIndex: -1
      }} />

      <div className="launch-logo-container" style={{ marginBottom: '40px', animation: 'pulse 3s infinite ease-in-out' }}>
        <Image 
          src="/images/jalaloadedlogo.png" 
          alt="Jalaloaded Logo" 
          width={300} 
          height={96} 
          className="launch-logo"
          style={{ objectFit: 'contain' }}
          priority 
        />
      </div>

      <div className="launch-kicker" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '24px' }}>
        Get Ready For The Launch
      </div>

      {timeLeft ? (
        <div className="countdown-grid" style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className="time-block">
            <div className="time-num">
              {(timeLeft as any).d.toString().padStart(2, '0')}
            </div>
            <div className="time-label">Days</div>
          </div>
          <div className="time-block">
            <div className="time-num">
              {(timeLeft as any).h.toString().padStart(2, '0')}
            </div>
            <div className="time-label">Hours</div>
          </div>
          <div className="time-block">
            <div className="time-num">
              {(timeLeft as any).m.toString().padStart(2, '0')}
            </div>
            <div className="time-label">Minutes</div>
          </div>
          <div className="time-block">
            <div className="time-num">
              {(timeLeft as any).s.toString().padStart(2, '0')}
            </div>
            <div className="time-label">Seconds</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '24px', fontWeight: 700 }}>Starting now...</div>
      )}

      <div className="launch-footer" style={{ marginTop: '60px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
        © 2026 JALALOADED • THE VIBE IS ALMOST HERE
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }

        .time-block { text-align: center; }
        .time-num { 
          font-size: 70px; 
          font-weight: 900; 
          font-family: "Bebas Neue", sans-serif; 
          color: #FF6B00; 
          line-height: 1; 
        }
        .time-label { 
          font-size: 10px; 
          color: rgba(255,255,255,0.3); 
          text-transform: uppercase; 
          marginTop: 4px; 
          letter-spacing: 1px;
        }

        @media (max-width: 768px) {
          .launch-logo { width: 220px !important; height: auto !important; }
          .launch-kicker { font-size: 11px !important; letter-spacing: 2px !important; }
          .time-num { font-size: 48px !important; }
          .countdown-grid { gap: 15px !important; }
          .glow-bg { width: 300px !important; height: 300px !important; }
        }
      `}</style>
    </div>
  );
}
