import dbConnect from '@/lib/mongodb';
import Artist from '@/models/Artist';
import Song from '@/models/Song';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TrackAction from '@/components/TrackAction';
import UpcomingMusic from '@/models/UpcomingMusic';
import CountdownTimer from '@/components/CountdownTimer';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const artist = await Artist.findOne({ slug }).lean();
  if (!artist) return { title: 'Artist Not Found' };

  return {
    title: `${artist.name} Songs & Biography`,
    description: artist.bio || `Listen to the latest songs by ${artist.name} on Jalaloaded.`,
    openGraph: {
      title: `${artist.name} on Jalaloaded`,
      description: artist.bio || `Listen to the latest songs by ${artist.name}.`,
      type: 'profile',
      ...(artist.image ? { images: [{ url: artist.image, width: 500, height: 500 }] } : {}),
    },
  };
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await dbConnect();
  
  const artist = await Artist.findOne({ slug }).lean();
  if (!artist) notFound();

  // Find all songs where artist name matches (since we store name in song.artist)
  // or you could store artistId in Song, but since the requirement changed late,
  // the simplest robust way is matching by exact name.
  const songs = await Song.find({ artist: artist.name })
    .sort({ createdAt: -1 })
    .lean();

  const upcomingTracks = await UpcomingMusic.find({ artist: artist.name })
    .sort({ releaseDate: 1 })
    .lean();

  return (
    <div className="jlh artist-page" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <div className="artist-container">
          
          <Link href="/music" className="artist-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Music
          </Link>

          {/* Artist Header */}
          <div className="artist-header-card">
            <div className="artist-avatar" style={{
              flexShrink: 0,
              background: artist.image ? `url(${artist.image}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!artist.image && <span style={{ fontSize: '40px' }}>🎤</span>}
            </div>
            <div className="artist-header-copy">
              <h1 className="artist-name">{artist.name}</h1>
              {artist.genre && <div className="artist-genre">{artist.genre}</div>}
              {artist.bio && <p className="artist-bio">{artist.bio}</p>}
            </div>
          </div>

          {/* Upcoming Drops */}
          {upcomingTracks.length > 0 && (
            <div style={{ marginTop: '30px', marginBottom: '30px' }}>
              <h2 className="artist-section-title">Upcoming Drops</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {upcomingTracks.map((track: any) => {
                  const isOut = new Date(track.releaseDate) <= new Date();
                  return (
                    <div key={track._id.toString()} style={{
                      display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
                      padding: '14px 16px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)', border: isOut ? '1px solid rgba(255,107,0,0.5)' : '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.2s',
                    }}>
                      
                      {/* Status/Icon */}
                      <div style={{ fontSize: '12px', color: isOut ? '#1DBE73' : '#FF6B00', fontWeight: 800, width: '24px', textAlign: 'center', flexShrink: 0 }}>
                        {isOut ? '▶' : '⏳'}
                      </div>

                      {/* Cover Art */}
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden',
                        background: track.coverUrl ? `url(${track.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,107,0,0.05))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.04)', flexShrink: 0
                      }}>
                        {!track.coverUrl && <span style={{ fontSize: '18px', opacity: 0.4 }}>🎵</span>}
                      </div>
                      
                      {/* Track Info */}
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {track.title}
                          </div>
                          {!isOut && <span style={{ padding: '2px 6px', background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: '8px', fontWeight: 800, borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>Upcoming</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                          <span style={{ color: '#FF6B00', fontWeight: 600 }}>{track.artist}</span>
                        </div>
                        {track.description && (
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '3px', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {track.description}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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

          {/* Discography */}
          <h2 className="artist-section-title">Latest Releases</h2>
          
          {songs.length === 0 ? (
            <div className="artist-empty-state">
              <div className="artist-empty-text">No tracks available yet.</div>
            </div>
          ) : (
            <div className="artist-song-list">
              {songs.map((song: any, i: number) => (
                <div key={song._id.toString()} className="artist-song-row">
                  <div className="artist-song-index">{i + 1}</div>
                  <Link href={`/music/${song.slug || song._id}`} className="artist-song-cover" style={{
                    background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
                  }}>
                    {!song.coverUrl && <span style={{ fontSize: '18px' }}>🎵</span>}
                  </Link>
                  <div className="artist-song-text">
                    <Link href={`/music/${song.slug || song._id}`} className="artist-song-link">
                      <div className="artist-song-title">{song.title}</div>
                      <div className="artist-song-meta">{song.year} • {song.genre}</div>
                    </Link>
                  </div>
                  
                  <div className="artist-song-actions">
                    {song.mediaUrl && (
                      <Link href={`/music/${song.slug || song._id}`} title="Listen" className="artist-song-action-btn artist-song-action-listen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </Link>
                    )}
                    {(song.downloadUrl || song.mediaUrl) && (
                      <TrackAction songId={song._id.toString()} action="download" href={`/api/songs/${song._id.toString()}/download`} download title="Download" className="artist-song-action-btn artist-song-action-download">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </TrackAction>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
      </div>
    </div>
  );
}
