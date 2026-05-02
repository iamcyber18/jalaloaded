import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
      'Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Manchester City', 'Man United', 'Manchester United', 'Man Utd', 'Tottenham', 'Spurs',
      'Real Madrid', 'Barcelona', 'Atlético Madrid', 'Atletico Madrid', 'Athletic Club', 'Sevilla',
      'Bayern', 'Dortmund', 'Leverkusen', 'RB Leipzig',
      'PSG', 'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma'
    ].map(t => t.toLowerCase());

    const isTopTeam = (teamName: string) => {
      const lower = teamName.toLowerCase();
      // Check if the team name contains any of our top team keywords
      // OR if any of our keywords are contained within the team name
      return TOP_TEAMS.some(t => lower.includes(t) || t.includes(lower));
    };

    // Sort priority
    const getPriority = (score: any) => {
       const isBigMatch = isTopTeam(score.h) || isTopTeam(score.a) || score.league === 'UCL';
       
       // Priority levels:
       // 1. LIVE Big Match
       // 2. PRE Big Match
       // 3. LIVE Small Match
       // 4. PRE Small Match
       // 5. FT Big Match
       // 6. FT Small Match

       if (score.status === 'LIVE') {
         return isBigMatch ? 1 : 3;
       }
       if (score.status === 'PRE') {
         return isBigMatch ? 2 : 4;
       }
       // Finished matches
       return isBigMatch ? 5 : 6;
    };

    flattened.sort((a, b) => getPriority(a) - getPriority(b));

    // Limit to 30 matches
    const finalScores = flattened.slice(0, 30);

    return NextResponse.json({ scores: finalScores });
  } catch (err) {
    console.error('ESPN API error:', err);
    return NextResponse.json({ scores: [] }, { status: 500 });
  }
}
