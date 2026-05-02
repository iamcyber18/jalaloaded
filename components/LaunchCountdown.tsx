'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ m: number; s: number } | null>(null);
  const [isLaunched, setIsLaunched] = useState(false);

  // Set the launch time: 2026-05-02T14:23:00 (approx 2 mins from current request)
  const LAUNCH_DATE = new Date('2026-05-02T14:23:00+01:00').getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE - now;

      if (distance <= 0) {
        clearInterval(timer);
        setIsLaunched(true);
      } else {
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ m, s });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLaunched) return null;

  return (
    <div style={{
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
      fontFamily: '"DM Sans", sans-serif'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%)',
        zIndex: -1
      }} />

      <div style={{ marginBottom: '40px', animation: 'pulse 3s infinite ease-in-out' }}>
        <Image 
          src="/images/jalaloadedlogo.png" 
          alt="Jalaloaded Logo" 
          width={300} 
          height={96} 
          style={{ objectFit: 'contain' }}
          priority 
        />
      </div>

      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '24px' }}>
        Get Ready For The Launch
      </div>

      {timeLeft ? (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '80px', fontWeight: 900, fontFamily: '"Bebas Neue", sans-serif', color: '#FF6B00', lineHeight: 1 }}>
              {timeLeft.m.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '4px' }}>Minutes</div>
          </div>
          <div style={{ fontSize: '60px', fontWeight: 900, color: 'rgba(255,255,255,0.1)', marginBottom: '14px' }}>:</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '80px', fontWeight: 900, fontFamily: '"Bebas Neue", sans-serif', color: '#FF6B00', lineHeight: 1 }}>
              {timeLeft.s.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '4px' }}>Seconds</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '24px', fontWeight: 700 }}>Starting now...</div>
      )}

      <div style={{ marginTop: '60px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
        © 2026 JALALOADED • THE VIBE IS ALMOST HERE
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
