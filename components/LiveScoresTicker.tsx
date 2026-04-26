'use client';

import { useState, useEffect } from 'react';

const fallbackScores = [
  {h:'Man City',a:'Arsenal',hs:2,as:1,status:'LIVE',min:'67\'',league:'EPL',id:'fb1'},
  {h:'PSG',a:'Barcelona',hs:1,as:1,status:'LIVE',min:'43\'',league:'UCL',id:'fb2'},
  {h:'Real Madrid',a:'Atletico',hs:3,as:0,status:'FT',min:'FT',league:'La Liga',id:'fb3'},
  {h:'Bayern',a:'Dortmund',hs:1,as:2,status:'FT',min:'FT',league:'Bundesliga',id:'fb4'},
  {h:'Napoli',a:'Juventus',hs:0,as:0,status:'LIVE',min:'12\'',league:'Serie A',id:'fb5'},
];

export default function LiveScoresTicker() {
  const [scores, setScores] = useState<any[]>(fallbackScores);

  useEffect(() => {
    let mounted = true;

    const fetchScores = async () => {
      try {
        const res = await fetch('/api/scores');
        if (res.ok) {
           const data = await res.json();
           if (data.scores && data.scores.length > 0 && mounted) {
              setScores(data.scores);
           }
        }
      } catch (err) {
        console.error('Failed fetching live scores', err);
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, 60000); // Fetch new standard scores every minute
    return () => {
      mounted = false;
      clearInterval(interval);
    }
  }, []);

  // Double array for infinite scroll effect
  const displayScores = scores.length > 0 ? [...scores, ...scores] : [];

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
