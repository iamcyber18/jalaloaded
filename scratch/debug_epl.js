async function debug() {
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');
  const data = await res.json();
  
  console.log('API Day:', data.day?.date);
  
  if (!data.events) {
    console.log('No events found');
    return;
  }

  data.events.forEach(event => {
    const comp = event.competitions[0];
    const home = comp.competitors.find(c => c.homeAway === 'home');
    const away = comp.competitors.find(c => c.homeAway === 'away');
    console.log(`- ${home.team.name} vs ${away.team.name} Date: ${event.date}`);
  });
}

debug();
