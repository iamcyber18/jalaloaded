'use client';

import { useState, useEffect } from 'react';

export default function LiveScoresTicker() {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchScores = async () => {
      try {
        const res = await fetch('/api/scores', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.scores && mounted) {
            setScores(data.scores);
          }
        }
      } catch (err) {
        console.error('Failed fetching live scores', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, 30000); // Fetch fresh live scores every 30 seconds
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && scores.length === 0) {
    return (
      <div className="fticker">
        <div className="fticker-inner">
          <div className="fticker-label">
            <div className="live-dot"></div>LIVE SCORES
          </div>
          <div className="scores-scroll" style={{ display: 'flex', alignItems: 'center', paddingLeft: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            Updating live scores...
          </div>
        </div>
      </div>
    );
  }

  if (scores.length === 0) return null;

  // Double array for infinite scroll effect
  const displayScores = [...scores, ...scores];


  return (
    <div className="fticker">
      <div className="fticker-inner">
        <div className="fticker-label">
          <div className="live-dot"></div>LIVE SCORES
        </div>
        <div className="scores-scroll">
          <div className="scores-track">
            {displayScores.map((s, idx) => (
              <div key={`${s.id}-${idx}`} className="score-item">
                {s.status === 'LIVE' && <span className="score-live">LIVE</span>}
                <span className="team-name">{s.h}</span>
                {s.status === 'PRE' ? (
                   <span className="score-val" style={{fontSize: '9px', opacity: 0.6}}>v</span>
                ) : (
                   <span className="score-val">{s.hs} - {s.as}</span>
                )}
                <span className="team-name">{s.a}</span>
                {s.status === 'LIVE' ? (
                  <span className="score-min">{s.min}</span>
                ) : s.status === 'HT' ? (
                  <span className="ms-hf" style={{fontSize: '9px', padding: '1px 5px', borderRadius: '3px'}}>HT</span>
                ) : s.status === 'FT' ? (
                  <span className="score-ft">FT</span>
                ) : (
                  <span className="score-ft" style={{background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase'}}>{s.min}</span>
                )}
                <span style={{fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginLeft: '2px'}}>{s.league}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
