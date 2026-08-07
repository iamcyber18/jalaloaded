import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import TrackAction from '@/components/TrackAction';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';
import UpcomingMusic from '@/models/UpcomingMusic';
import Album from '@/models/Album';
import CountdownTimer from '@/components/CountdownTimer';
import TrackList from '@/components/TrackList';

export const dynamic = 'force-dynamic';

async function getMusicData(genre?: string) {
  await dbConnect();

  const query: any = { status: 'Published', ...(genre && genre !== 'All' ? { genre } : {}) };

  const songs = await Song.find(query).sort({ createdAt: -1 }).lean();
  const featuredSongs = await Song.find({ featured: true, status: 'Published' }).sort({ createdAt: -1 }).lean();
  const totalPlays = await Song.aggregate([{ $match: { status: 'Published' } }, { $group: { _id: null, total: { $sum: '$plays' } } }]);
  const totalDownloads = await Song.aggregate([{ $match: { status: 'Published' } }, { $group: { _id: null, total: { $sum: '$downloads' } } }]);

  const upcomingTracks = await UpcomingMusic.find().sort({ releaseDate: 1 }).lean();
  const albums = await Album.find({}).sort({ year: -1, createdAt: -1 }).limit(8).lean();

  const topSongs = await Song.find({ status: 'Published' }).sort({ plays: -1 }).limit(5).lean();

  return {
    songs: JSON.parse(JSON.stringify(songs)),
    featuredSongs: JSON.parse(JSON.stringify(featuredSongs)),
    totalPlays: totalPlays[0]?.total || 0,
    totalDownloads: totalDownloads[0]?.total || 0,
    upcomingTracks: JSON.parse(JSON.stringify(upcomingTracks)),
    albums: JSON.parse(JSON.stringify(albums)),
    topSongs: JSON.parse(JSON.stringify(topSongs)),
  };
}

export default async function MusicPage({ searchParams }: { searchParams: Promise<{ genre?: string }> }) {
  const resolvedParams = await searchParams;
  const currentGenre = resolvedParams.genre || 'All';
  const { songs, featuredSongs, totalPlays, totalDownloads, upcomingTracks, albums, topSongs } = await getMusicData(currentGenre);

  const genres = ['All', 'Afrobeats', 'Amapiano', 'Highlife', 'R&B', 'Gospel', 'Hip-hop', 'Other'];

  const genreColors: Record<string, string> = {
    'Afrobeats': '#FF6B00', 'Amapiano': '#6358FF', 'Highlife': '#1DBE73',
    'R&B': '#e63946', 'Gospel': '#00b4d8', 'Hip-hop': '#f77f00', 'Other': '#888'
  };

  const formatDuration = (d?: number) => {
    if (!d) return '--:--';
    const m = Math.floor(d / 60);
    const s = Math.floor(d % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="jlh" style={{ minHeight: '100vh', paddingBottom: '40px', position: 'relative', overflow: 'hidden' }}>

      {/* AMBIENT BACKGROUND ORBS */}
      <div className="music-ambient-orb" style={{
        position: 'fixed', top: '-150px', left: '-100px', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', zIndex: 0
      }} />
      <div className="music-ambient-orb" style={{
        position: 'fixed', bottom: '-100px', right: '-80px', width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(99,88,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, animationDelay: '3s'
      }} />

      {/* FEATURED CAROUSEL */}
      {featuredSongs.length > 0 ? (
        <FeaturedCarousel songs={featuredSongs} />
      ) : songs.length > 0 ? (
        <FeaturedCarousel songs={songs.slice(0, 3)} />
      ) : null}

      {/* MAIN CONTENT */}
      <div className="page" style={{ maxWidth: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ minWidth: 0 }}>

          {/* GENRE FILTERS — Animated pills with mobile touch scroll */}
          <div className="music-genre-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
            {genres.map(genre => {
              const isActive = currentGenre === genre;
              return (
                <Link
                  key={genre}
                  href={genre !== 'All' ? `/music?genre=${genre}` : '/music'}
                  className={`music-genre-filter ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '7px 18px', borderRadius: '24px', fontSize: '11px', fontWeight: 700,
                    textDecoration: 'none', letterSpacing: '0.5px',
                    background: isActive ? 'linear-gradient(135deg, #FF6B00, #ff8533)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                    border: isActive ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                    textTransform: 'uppercase',
                  }}
                >
                  {genre}
                </Link>
              );
            })}
          </div>


          {albums.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: 'linear-gradient(180deg, #FF6B00, #ff8533)' }} />
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif' }}>Latest Albums</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {albums.map((album: any) => (
                  <Link key={album._id.toString()} href={`/music/album/${album.slug || album._id}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        borderRadius: '16px',
                        padding: '12px',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '112px',
                          borderRadius: '12px',
                          background: album.coverUrl ? `url(${album.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.25), rgba(255,107,0,0.08))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                      >
                        {!album.coverUrl && <span style={{ fontSize: '24px', opacity: 0.45 }}>💿</span>}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.artist}</div>
                      <div style={{ fontSize: '10px', color: '#FF6B00', marginTop: '4px', fontWeight: 700 }}>{album.type || 'Album'} • {album.year || new Date(album.createdAt).getFullYear()}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* TRACK COUNT HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '4px', height: '20px', borderRadius: '2px',
                background: 'linear-gradient(180deg, #FF6B00, #ff8533)',
                boxShadow: '0 0 8px rgba(255,107,0,0.4)'
              }} />
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif' }}>
                {currentGenre === 'All' ? 'All Tracks' : currentGenre}
              </div>
              <span style={{
                fontWeight: 600, color: 'rgba(255,255,255,0.3)', fontSize: '12px',
                padding: '2px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)'
              }}>
                {songs.length}
              </span>
            </div>
          </div>

          {/* TRACK LIST */}
          <div>
            {songs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
                <div style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 16px rgba(255,107,0,0.3))' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,107,0,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
                <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '16px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                  No tracks found{currentGenre !== 'All' ? ` in ${currentGenre}` : ''}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>Check back soon for fresh drops!</div>
              </div>
            ) : (
              <TrackList songs={songs} initialLimit={12} genreColors={genreColors} />
            )}
          </div>

          {/* UPCOMING DROPS (Below Tracks) */}
          {currentGenre === 'All' && upcomingTracks.length > 0 && (
            <div style={{ marginTop: '40px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', gap: '12px' }}>
                <span style={{ fontSize: '20px', filter: 'drop-shadow(0 0 8px rgba(255,107,0,0.4))' }}>⏳</span>
                <div style={{
                  fontSize: '18px', fontWeight: 800, fontFamily: '"Bebas Neue", sans-serif',
                  color: '#FF6B00', letterSpacing: '1.5px',
                  textShadow: '0 0 12px rgba(255,107,0,0.3)'
                }}>
                  Upcoming Drops
                </div>
                <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,107,0,0.3), transparent)', flex: 1 }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {upcomingTracks.map((track: any, i: number) => {
                  const isOut = new Date(track.releaseDate) <= new Date();
                  return (
                    <div key={track._id.toString()} className="music-upcoming-row" style={{
                      display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
                      padding: '14px 16px', borderRadius: '14px',
                      background: isOut ? 'rgba(29,190,115,0.04)' : 'rgba(255,255,255,0.02)',
                      border: isOut ? '1px solid rgba(29,190,115,0.3)' : '1px solid rgba(255,255,255,0.04)',
                      animationDelay: `${i * 0.08}s`,
                    }}>
                      
                      {/* Status/Icon */}
                      <div style={{ fontSize: '14px', color: isOut ? '#1DBE73' : '#FF6B00', fontWeight: 800, width: '24px', textAlign: 'center', flexShrink: 0 }}>
                        {isOut ? <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                      </div>

                      {/* Cover Art */}
                      <div className="music-track-cover" style={{
                        width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden',
                        background: track.coverUrl ? `url(${track.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,107,0,0.05))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.04)', flexShrink: 0
                      }}>
                        {!track.coverUrl && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                      </div>
                      
                      {/* Track Info */}
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="music-track-title" style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: '"Syne", sans-serif' }}>
                            {track.title}
                          </div>
                          {!isOut && <span style={{ padding: '2px 8px', background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: '8px', fontWeight: 800, borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', flexShrink: 0 }}>Upcoming</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                          <span style={{ color: '#FF6B00', fontWeight: 700 }}>{track.artist}</span>
                        </div>
                        {track.description && (
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', marginTop: '3px', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {track.description}
                          </div>
                        )}
                      </div>

                      <div className="music-upcoming-controls" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        {/* Audio Teaser */}
                        {track.snippetUrl && !isOut && (
                          <div style={{ flexShrink: 0 }}>
                            <audio controls controlsList="nodownload" style={{ height: '32px', width: '150px' }}>
                              <source src={track.snippetUrl} type="audio/mpeg" />
                              <source src={track.snippetUrl} type="audio/mp4" />
                            </audio>
                          </div>
                        )}

                        {/* Countdown Timer or Action */}
                        <div style={{ flexShrink: 0 }}>
                          <CountdownTimer targetDate={track.releaseDate} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR — Elevated with hover glows */}
        <div className="sidebar">
          {/* Most Played Songs List */}
          <div className="s-card music-sidebar-card">
            <div className="s-title"><div className="s-line"></div>🔥 Most Played</div>
            <div>
              {topSongs.map((song: any, i: number) => (
                <Link key={song._id.toString()} href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none' }}>
                  <div className="music-rank-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 4px', borderBottom: i < topSongs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{
                      fontSize: '16px', fontWeight: 800, width: '22px', textAlign: 'center', flexShrink: 0,
                      fontFamily: '"Bebas Neue", sans-serif',
                      color: i < 3 ? '#FF6B00' : 'rgba(255,255,255,0.15)',
                      textShadow: i < 3 ? '0 0 8px rgba(255,107,0,0.3)' : 'none'
                    }}>
                      {i + 1}
                    </div>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
                      background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: i < 3 ? '0 2px 10px rgba(255,107,0,0.15)' : 'none'
                    }}>
                      {!song.coverUrl && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: '"Syne", sans-serif' }}>{song.title}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{song.artist} • {formatNumber(song.plays || 0)} plays</div>
                    </div>
                  </div>
                </Link>
              ))}
              {topSongs.length === 0 && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', padding: '12px 0' }}>No songs yet.</div>
              )}
            </div>
          </div>

          {/* Most Downloaded */}
          <div className="s-card music-sidebar-card">
            <div className="s-title"><div className="s-line"></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Most Downloaded</div>
            <div>
              {[...songs].sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 5).map((song: any, i: number) => (
                <Link key={song._id.toString()} href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none' }}>
                  <div className="music-rank-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 800, width: '22px', textAlign: 'center',
                      fontFamily: '"Bebas Neue", sans-serif',
                      color: i === 0 ? '#FF6B00' : 'rgba(255,255,255,0.15)'
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                      background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {!song.coverUrl && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: '"Syne", sans-serif' }}>{song.title}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{formatNumber(song.downloads || 0)} downloads</div>
                    </div>
                  </div>
                </Link>
              ))}
              {songs.length === 0 && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', padding: '12px 0' }}>No songs yet.</div>
              )}
            </div>
          </div>

          {/* Latest Uploads */}
          <div className="s-card music-sidebar-card">
            <div className="s-title"><div className="s-line"></div>🆕 Latest Uploads</div>
            <div>
              {songs.slice(0, 4).map((song: any) => (
                <Link key={song._id.toString()} href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none' }}>
                  <div className="music-rank-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                      background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(99,88,255,0.3), rgba(99,88,255,0.1))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {!song.coverUrl && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: '"Syne", sans-serif' }}>{song.title}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{song.artist} • {song.genre}</div>
                    </div>
                  </div>
                </Link>
              ))}
              {songs.length === 0 && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', padding: '12px 0' }}>No songs yet.</div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="s-card music-sidebar-card">
            <div className="s-title"><div className="s-line"></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>About the Music</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              All tracks on Jalaloaded are curated and shared for free. Listen online, stream on your favourite platform, or download directly. Share the vibes.
            </div>
            <div style={{ marginTop: '14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>Free Download</span>
              <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(29,190,115,0.1)', color: '#1DBE73', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>Stream Online</span>
              <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(99,88,255,0.1)', color: '#6358FF', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>Curated</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
