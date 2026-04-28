import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import Link from 'next/link';
import { formatNumber, timeAgo } from '@/lib/utils';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getMusicData(genre?: string) {
  await dbConnect();
  
  const query = genre && genre !== 'All' ? { genre } : {};
  
  // Get all matching songs
  const songs = await Song.find(query).sort({ createdAt: -1 }).lean();
  
  // Find top downloaded song for the hero section
  const heroSong = await Song.findOne().sort({ downloads: -1, plays: -1 }).lean();
  
  return { 
    songs: JSON.parse(JSON.stringify(songs)), 
    heroSong: JSON.parse(JSON.stringify(heroSong)) 
  };
}

export default async function MusicPage({ searchParams }: { searchParams: Promise<{ genre?: string }> }) {
  const resolvedParams = await searchParams;
  const currentGenre = resolvedParams.genre || 'All';
  const { songs, heroSong } = await getMusicData(currentGenre);
  
  const genres = ['All', 'Afrobeats', 'Amapiano', 'Highlife', 'R&B', 'Gospel', 'Hip-hop'];

  const genreColors: Record<string, string> = {
    'Afrobeats':'#FF6B00','Amapiano':'#6358FF','Highlife':'#1DBE73',
    'R&B':'#e63946','Gospel':'#00b4d8'
  };

  return (
    <div className="jlh min-h-screen pb-10">
      
      {/* HERO PLAYER */}
      <div className="hero-player" id="hero-player">
        <div className="hero-bg-text">MUSIC</div>
        <div className="hero-inner">
          <div className="hero-cover">
            <div className="cover-art" id="hero-cover-art" style={heroSong?.coverUrl ? { background: `url(${heroSong.coverUrl})` } : { background: 'linear-gradient(135deg,#FF6B00,#c84b00)' }}>
              <div className="cover-spin" id="cover-spin"></div>
              <div className="vinyl-ring"></div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
          </div>
          <div className="hero-info">
            <div className="now-label" id="now-label">Top Track</div>
            <div className="hero-title" id="hero-track-title">{heroSong?.title || 'No Tracks Yet'}</div>
            <div className="hero-artist" id="hero-track-artist">{heroSong?.artist || 'Unknown Artist'} &bull; Jalaloaded</div>
            <div className="hero-tags">
              <span className="htag" id="hero-genre-tag">{heroSong?.genre || 'Afrobeats'}</span>
              <span className="htag" id="hero-year-tag">{heroSong?.year || new Date(heroSong?.createdAt || Date.now()).getFullYear()}</span>
            </div>
          </div>
          <div className="hero-right">
            {heroSong?.downloadUrl || heroSong?.mediaUrl ? (
              <a href={heroSong.downloadUrl || heroSong.mediaUrl} download target="_blank" rel="noopener noreferrer" className="dl-hero-btn" style={{ textDecoration: 'none' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </a>
            ) : (
              <button className="dl-hero-btn" id="hero-dl-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            )}
            {heroSong?.streamUrl && (
              <a href={heroSong.streamUrl} target="_blank" rel="noopener noreferrer" className="share-hero-btn" style={{ textDecoration: 'none' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Stream Online
              </a>
            )}
            {!heroSong?.streamUrl && (
              <button className="share-hero-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share Track
              </button>
            )}
            <div className="hero-stats">
              <div className="hstat"><div className="hstat-val" id="hero-plays">{formatNumber(heroSong?.plays || 0)}</div><div className="hstat-label">Plays</div></div>
              <div className="hstat"><div className="hstat-val" id="hero-dls">{formatNumber(heroSong?.downloads || 0)}</div><div className="hstat-label">Downloads</div></div>
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="progress-area">
          <div className="progress-times">
            <span id="curr-time">0:00</span>
            <span id="total-time">3:24</span>
          </div>
          <div className="progress-track" id="progress-track">
            <div className="progress-fill" id="progress-fill" style={{ width: '0%' }}>
              <div className="progress-thumb"></div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="controls">
          <div className="ctrl-left">
            <button className="ctrl-btn" id="shuffle-btn" title="Shuffle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
            </button>
          </div>
          <div className="ctrl-center">
            <button className="ctrl-btn" title="Previous">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>
            <button className="play-big" id="play-btn">
              <svg id="play-icon" width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <button className="ctrl-btn" title="Next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
          </div>
          <div className="ctrl-right">
            <button className="ctrl-btn" id="repeat-btn" title="Repeat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </button>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <input type="range" className="vol-slider" min="0" max="100" defaultValue="75" id="vol-slider" />
          </div>
        </div>
      </div>

      {/* PAGE BODY */}
      <div className="page" style={{ maxWidth: '100%' }}>
        <div style={{ minWidth: 0 }}>
          {/* ALBUMS */}
          <div className="sec-hdr">
            <div className="sec-title"><div className="sec-line"></div>Albums & EPs</div>
            <div className="sec-more">View all &rarr;</div>
          </div>
          <div className="albums-scroll" id="albums-scroll">
            <div className="album-card">
              <div className="album-cover" style={{ background: 'linear-gradient(135deg,#FF6B00,#c84b00)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <div className="album-info">
                <div className="album-title">Loaded Vol. 1</div>
                <div className="album-artist">Jalal</div>
                <div className="album-count">5 tracks</div>
              </div>
            </div>
            <div className="album-card">
              <div className="album-cover" style={{ background: 'linear-gradient(135deg,#6358FF,#3d00cc)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <div className="album-info">
                <div className="album-title">Night Shift</div>
                <div className="album-artist">Co-friend</div>
                <div className="album-count">3 tracks</div>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filter-row" id="filter-row">
            {genres.map(genre => (
              <Link 
                key={genre} 
                href={genre !== 'All' ? `/music?genre=${genre}` : '/music'}
                className={`filter-chip ${currentGenre === genre ? 'sel' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                {genre}
              </Link>
            ))}
            <div className="filter-right">
              <button className="view-btn sel" title="List view">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* TRACK COUNT */}
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '10px' }}>Showing {songs.length} track{songs.length !== 1 ? 's' : ''}</div>

          {/* TRACK LIST */}
          <div id="track-list">
            {songs.map((song: any, i: number) => {
              const gc = genreColors[song.genre] || '#888';
              return (
                <div key={song._id.toString()} className="track-item">
                  <div className="track-num">{i + 1}</div>
                  <div className="track-cover" style={{ background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'var(--color-background-secondary)' }}>
                    {!song.coverUrl && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                  </div>
                  <div className="track-info">
                    <div className="track-title">{song.title}</div>
                    <div className="track-meta">{song.artist} &bull; {formatNumber(song.plays || 0)} plays{song.year ? ` • ${song.year}` : ''}</div>
                    {song.description && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '2px', lineHeight: 1.4, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.description}</div>}
                  </div>
                  <span className="track-genre" style={{ background: `${gc}22`, color: gc }}>{song.genre}</span>
                  <div className="track-dur">3:24</div>
                  <div className="track-actions">
                    {(song.downloadUrl || song.mediaUrl) && (
                      <a href={song.downloadUrl || song.mediaUrl} download target="_blank" rel="noopener noreferrer" className="t-btn dl" title="Download" style={{ textDecoration: 'none' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </a>
                    )}
                    {song.streamUrl && (
                      <a href={song.streamUrl} target="_blank" rel="noopener noreferrer" className="t-btn" title="Stream" style={{ textDecoration: 'none', color: '#1DBE73' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="s-card">
            <div className="s-title"><div className="s-line2"></div>Up Next</div>
            <div id="queue-list">
               {songs.slice(1, 4).map((song: any) => (
                 <div key={song._id.toString()} className="queue-item">
                   <div className="q-cover" style={song.coverUrl ? { background: `url(${song.coverUrl}) center/cover` } : { background: 'var(--color-background-secondary)' }}>
                     {!song.coverUrl && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                   </div>
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div className="q-title">{song.title}</div>
                     <div className="q-artist">{song.artist}</div>
                   </div>
                   <div className="q-dur">3:24</div>
                 </div>
               ))}
            </div>
          </div>

          <div className="s-card">
            <div className="s-title"><div className="s-line2"></div>Most Downloaded</div>
            <div id="top-dl-list">
              {songs.slice(0, 5).map((song: any, i: number) => (
                <div key={song._id.toString()} className="top-dl-item">
                  <div className="dl-rank">0{i+1}</div>
                  <div className="dl-info">
                    <div className="dl-title">{song.title}</div>
                    <div className="dl-count">{formatNumber(song.downloads || 0)} downloads</div>
                  </div>
                  <button className="mini-dl-btn">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    DL
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="s-card">
            <div className="s-title"><div className="s-line2"></div>About the Music</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>All tracks on Jalaloaded are original uploads by <strong>Jalal</strong> and <strong>Co-friend</strong>. Free to listen, free to download. Share the vibes.</div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,107,0,0.1)', color: 'var(--orange)', fontSize: '10px', fontWeight: 500 }}>{songs.length} Tracks</div>
              <div style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,107,0,0.1)', color: 'var(--orange)', fontSize: '10px', fontWeight: 500 }}>{genres.length} Genres</div>
              <div style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,107,0,0.1)', color: 'var(--orange)', fontSize: '10px', fontWeight: 500 }}>Free Download</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
