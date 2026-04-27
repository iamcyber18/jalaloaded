const LEAGUES = [
  { id: 'eng.1', name: 'EPL' },
  { id: 'uefa.champions', name: 'UCL' },
  { id: 'esp.1', name: 'La Liga' },
  { id: 'ger.1', name: 'Bundesliga' }
];

async function run() {
  for (const league of LEAGUES) {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard`);
    const data = await res.json();
    if (data.events) {
      console.log(`--- ${league.name} ---`);
      for (const event of data.events) {
        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        const hName = home?.team?.shortDisplayName || home?.team?.name || 'Home';
        const aName = away?.team?.shortDisplayName || away?.team?.name || 'Away';
        console.log(`${hName} vs ${aName}`);
      }
    }
  }
}

run();
