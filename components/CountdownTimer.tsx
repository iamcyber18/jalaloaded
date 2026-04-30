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

  if (!timeLeft) return <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', minHeight: '60px' }}>Loading countdown...</div>;

  if (timeLeft.isOut) {
    return (
      <div style={{ padding: '16px', background: 'rgba(255,107,0,0.1)', borderRadius: '12px', border: '1px solid rgba(255,107,0,0.3)', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Available Now!
        </div>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number, label: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', minWidth: '60px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif' }}>
        {value.toString().padStart(2, '0')}
      </div>
      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary)', marginTop: '4px', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      <TimeBlock value={timeLeft.days} label="Days" />
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <TimeBlock value={timeLeft.minutes} label="Mins" />
      <TimeBlock value={timeLeft.seconds} label="Secs" />
    </div>
  );
}
