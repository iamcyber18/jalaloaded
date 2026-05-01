'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isOut: boolean } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOut: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOut: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      if (newTime.isOut) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', width: '80px', textAlign: 'center' }}>...</div>;

  if (timeLeft.isOut) {
    return (
      <div style={{ padding: '6px 12px', background: 'rgba(29,190,115,0.1)', borderRadius: '8px', border: '1px solid rgba(29,190,115,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#1DBE73', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Available Now
        </div>
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--orange)' }}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', fontFamily: '"Syne", sans-serif', letterSpacing: '0.5px' }}>
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </div>
    </div>
  );
}
