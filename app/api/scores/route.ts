import { NextResponse } from 'next/server';

export const revalidate = 60; // 1 minute generic cache wrapper

const LEAGUES = [
  { id: 'eng.1', name: 'EPL' },
  { id: 'uefa.champions', name: 'UCL' },
  { id: 'esp.1', name: 'La Liga' },
  { id: 'ger.1', name: 'Bundesliga' }
];

export async function GET() {
  try {
    const promises = LEAGUES.map(async (league) => {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard`, {
        next: { revalidate: 60 }
      });
      if (!res.ok) return [];
      const data = await res.json();
      
      if (!data.events) return [];

      return data.events.map((event: any) => {
        const comp = event.competitions[0];
        const home = comp.competitors.find((c: any) => c.homeAway === 'home');
        const away = comp.competitors.find((c: any) => c.homeAway === 'away');

        let status = 'PRE';
        if (event.status.type.state === 'in') status = 'LIVE';
        else if (event.status.type.state === 'post') status = 'FT';
        
        let min = event.status.type.shortDetail; 
        if (status === 'LIVE' && event.status.displayClock) {
           min = `${event.status.displayClock}'`;
        } else if (status === 'LIVE' && !event.status.displayClock) {
           min = 'LIVE';
        }

        return {
          id: event.id + '',
          h: home?.team?.shortDisplayName || home?.team?.name || 'Home',
          a: away?.team?.shortDisplayName || away?.team?.name || 'Away',
          hs: home?.score || '0',
          as: away?.score || '0',
          status,
          min,
          league: league.name
        };
      });
    });

    const results = await Promise.all(promises);
    const flattened = results.flat();

    const TOP_TEAMS = [
      'Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man United', 'Tottenham', 'Spurs',
      'Real Madrid', 'Barcelona', 'Atlético Madrid', 'Atletico Madrid', 'Athletic Club', 'Sevilla',
      'Bayern', 'Dortmund', 'Leverkusen', 'RB Leipzig',
      'PSG', 'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma'
    ].map(t => t.toLowerCase());

    const isTopTeam = (teamName: string) => {
      const lower = teamName.toLowerCase();
      return TOP_TEAMS.some(t => lower.includes(t));
    };

    const filteredScores = flattened.filter(score => {
      if (score.league === 'UCL') return true;
      return isTopTeam(score.h) || isTopTeam(score.a);
    });

    // Sort priority
    const getPriority = (status: string) => {
       if (status === 'LIVE') return 1;
       if (status === 'PRE') return 2;
       return 3; // FT
    };

    filteredScores.sort((a, b) => getPriority(a.status) - getPriority(b.status));

    return NextResponse.json({ scores: filteredScores });
  } catch (err) {
    console.error('ESPN API error:', err);
    return NextResponse.json({ scores: [] }, { status: 500 });
  }
}
