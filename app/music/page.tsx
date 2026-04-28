import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getMusicData(genre?: string) {
  await dbConnect();
  
  const query: any = { ...(genre && genre !== 'All' ? { genre } : {}) };
  
  const songs = await Song.find(query).sort({ createdAt: -1 }).lean();
  const heroSong = await Song.findOne().sort({ downloads: -1, plays: -1 }).lean();
  const totalPlays = await Song.aggregate([{ $group: { _id: null, total: { $sum: '$plays' } } }]);
  const totalDownloads = await Song.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]);
  
  return { 
    songs: JSON.parse(JSON.stringify(songs)), 
    heroSong: JSON.parse(JSON.stringify(heroSong)),
    totalPlays: totalPlays[0]?.total || 0,
    totalDownloads: totalDownloads[0]?.total || 0,
  };
}

export default async function MusicPage({ searchParams }: { searchParams: Promise<{ genre?: string }> }) {
  const resolvedParams = await searchParams;
  const currentGenre = resolvedParams.genre || 'All';
  const { songs, heroSong, totalPlays, totalDownloads } = await getMusicData(currentGenre);
  
  const genres = ['All', 'Afrobeats', 'Amapiano', 'Highlife', 'R&B', 'Gospel', 'Hip-hop', 'Other'];

  const genreColors: Record<string, string> = {
    'Afrobeats':'#FF6B00','Amapiano':'#6358FF','Highlife':'#1DBE73',
    'R&B':'#e63946','Gospel':'#00b4d8','Hip-hop':'#f77f00','Other':'#888'
  };

  const formatDuration = (d?: number) => {
    if (!d) return '--:--';
    const m = Math.floor(d / 60);
    const s = Math.floor(d % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="jlh" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* HERO - FEATURED TRACK */}
      {heroSong && (
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255,107,0,0.12) 0%, rgba(0,0,0,0) 60%)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '40px 0 36px'
        }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,107,0,0.08), transparent 70%)', pointerEvents: 'none' }} />
          
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Cover Art */}
            <div style={{
              width: '220px', height: '220px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,107,0,0.1)',
              background: heroSong.coverUrl ? `url(${heroSong.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}>
              {!heroSong.coverUrl && (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent 50%)' }} />
            </div>

            {/* Song Info */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,107,0,0.12)', color: '#FF6B00', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>🔥 Featured</span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600 }}>{heroSong.genre}</span>
              </div>
              
              <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '32px', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 6px' }}>
                {heroSong.title}
              </h1>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                {heroSong.artist} • {heroSong.year || new Date(heroSong.createdAt).getFullYear()}
              </div>
              {heroSong.description && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, marginBottom: '16px', maxWidth: '450px' }}>
                  {heroSong.description}
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{formatNumber(heroSong.plays || 0)}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plays</div>
                </div>
                <div>
                  <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{formatNumber(heroSong.downloads || 0)}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Downloads</div>
                </div>
                <div>
                  <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{formatNumber(heroSong.likes || 0)}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Likes</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(heroSong.downloadUrl || heroSong.mediaUrl) && (
                  <a href={heroSong.downloadUrl || heroSong.mediaUrl} download target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #FF6B00, #ff8533)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', transition: 'transform 0.2s', cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </a>
                )}
                {heroSong.streamUrl && (
                  <a href={heroSong.streamUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'rgba(29,190,115,0.1)', border: '1px solid rgba(29,190,115,0.2)', color: '#1DBE73', fontSize: '12px', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Stream Online
                  </a>
                )}
                {heroSong.mediaUrl && (
                  <a href={heroSong.mediaUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    Listen
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="page" style={{ maxWidth: '100%' }}>
        <div style={{ minWidth: 0 }}>

          {/* GENRE FILTERS */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
            {genres.map(genre => (
              <Link 
                key={genre} 
                href={genre !== 'All' ? `/music?genre=${genre}` : '/music'}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                  textDecoration: 'none', transition: 'all 0.2s',
                  background: currentGenre === genre ? '#FF6B00' : 'rgba(255,255,255,0.04)',
                  color: currentGenre === genre ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: currentGenre === genre ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {genre}
              </Link>
            ))}
          </div>

          {/* TRACK COUNT */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {currentGenre === 'All' ? 'All Tracks' : currentGenre} 
              <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>({songs.length})</span>
            </div>
          </div>

          {/* TRACK LIST */}
          <div>
            {songs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎵</div>
                No tracks found{currentGenre !== 'All' ? ` in ${currentGenre}` : ''}. Check back soon!
              </div>
            ) : (
              songs.map((song: any, i: number) => {
                const gc = genreColors[song.genre] || '#888';
                return (
                  <div key={song._id.toString()} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '12px', marginBottom: '6px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}>
                    {/* Track Number */}
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)', fontWeight: 700, width: '24px', textAlign: 'center', flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    {/* Cover Art */}
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
                      background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,107,0,0.05))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      {!song.coverUrl && <span style={{ fontSize: '18px', opacity: 0.4 }}>🎵</span>}
                    </div>

                    {/* Song Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {song.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                        {song.artist} • {song.year || new Date(song.createdAt).getFullYear()} • {formatNumber(song.plays || 0)} plays
                      </div>
                      {song.description && (
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '3px', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {song.description}
                        </div>
                      )}
                    </div>

                    {/* Genre Badge */}
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: 700,
                      background: `${gc}15`, color: gc, textTransform: 'uppercase', letterSpacing: '0.5px',
                      flexShrink: 0, display: 'none'
                    }} className="track-genre-badge">
                      {song.genre}
                    </span>

                    {/* Duration */}
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 500, flexShrink: 0, width: '40px', textAlign: 'center' }}>
                      {formatDuration(song.duration)}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      {song.mediaUrl && (
                        <a href={song.mediaUrl} target="_blank" rel="noopener noreferrer" title="Listen"
                          style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </a>
                      )}
                      {song.streamUrl && (
                        <a href={song.streamUrl} target="_blank" rel="noopener noreferrer" title="Stream Online"
                          style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(29,190,115,0.06)', border: '1px solid rgba(29,190,115,0.12)', textDecoration: 'none', color: '#1DBE73', transition: 'all 0.2s' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        </a>
                      )}
                      {(song.downloadUrl || song.mediaUrl) && (
                        <a href={song.downloadUrl || song.mediaUrl} download target="_blank" rel="noopener noreferrer" title="Download"
                          style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.12)', textDecoration: 'none', color: '#FF6B00', transition: 'all 0.2s' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          {/* Platform Stats */}
          <div className="s-card">
            <div className="s-title"><div className="s-line2"></div>Music Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{songs.length}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tracks</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{formatNumber(totalPlays)}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Plays</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{formatNumber(totalDownloads)}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Downloads</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '22px', color: '#FF6B00' }}>{genres.length - 1}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genres</div>
              </div>
            </div>
          </div>

          {/* Most Downloaded */}
          <div className="s-card">
            <div className="s-title"><div className="s-line2"></div>Most Downloaded</div>
            <div>
              {[...songs].sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 5).map((song: any, i: number) => (
                <div key={song._id.toString()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: i === 0 ? '#FF6B00' : 'rgba(255,255,255,0.15)', width: '20px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0,
                    background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {!song.coverUrl && <span style={{ fontSize: '12px' }}>🎵</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{formatNumber(song.downloads || 0)} downloads</div>
                  </div>
                  {(song.downloadUrl || song.mediaUrl) && (
                    <a href={song.downloadUrl || song.mediaUrl} download target="_blank" rel="noopener noreferrer"
                      style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,107,0,0.08)', color: '#FF6B00', fontSize: '9px', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,107,0,0.12)' }}>
                      DL
                    </a>
                  )}
                </div>
              ))}
              {songs.length === 0 && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', padding: '12px 0' }}>No songs yet.</div>
              )}
            </div>
          </div>

          {/* Latest Uploads */}
          <div className="s-card">
            <div className="s-title"><div className="s-line2"></div>Latest Uploads</div>
            <div>
              {songs.slice(0, 4).map((song: any) => (
                <div key={song._id.toString()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0,
                    background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(99,88,255,0.3), rgba(99,88,255,0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {!song.coverUrl && <span style={{ fontSize: '12px' }}>🎵</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{song.artist} • {song.genre}</div>
                  </div>
                </div>
              ))}
              {songs.length === 0 && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', padding: '12px 0' }}>No songs yet.</div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="s-card">
            <div className="s-title"><div className="s-line2"></div>About the Music</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              All tracks on Jalaloaded are curated and shared for free. Listen online, stream on your favourite platform, or download directly. Share the vibes.
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,107,0,0.08)', color: '#FF6B00', fontSize: '9px', fontWeight: 600 }}>Free Download</span>
              <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(29,190,115,0.08)', color: '#1DBE73', fontSize: '9px', fontWeight: 600 }}>Stream Online</span>
              <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(99,88,255,0.08)', color: '#6358FF', fontSize: '9px', fontWeight: 600 }}>Curated</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
