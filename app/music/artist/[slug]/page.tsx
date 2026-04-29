import dbConnect from '@/lib/mongodb';
import Artist from '@/models/Artist';
import Song from '@/models/Song';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TrackAction from '@/components/TrackAction';
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
