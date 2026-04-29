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
    <div className="jl" style={{ paddingBottom: '40px' }}>
      <div className="main">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          
          <Link href="/music" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#FF6B00', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: '24px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Music
          </Link>

          {/* Artist Header */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%', flexShrink: 0,
              background: artist.image ? `url(${artist.image}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
              boxShadow: '0 10px 30px rgba(255,107,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {!artist.image && <span style={{ fontSize: '40px' }}>🎤</span>}
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', fontFamily: '"Syne", sans-serif', letterSpacing: '-0.5px' }}>{artist.name}</h1>
              {artist.genre && <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>{artist.genre}</div>}
              {artist.bio && <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{artist.bio}</p>}
            </div>
          </div>

          {/* Discography */}
          <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: '"Syne", sans-serif', marginBottom: '20px' }}>Latest Releases</h2>
          
          {songs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No tracks available yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {songs.map((song: any, i: number) => (
                <div key={song._id.toString()} style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '12px',
                  background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.2s'
                }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', width: '20px', textAlign: 'center', fontFamily: 'monospace' }}>{i + 1}</div>
                  <Link href={`/music/${song.slug || song._id}`} style={{
                    width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                    background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {!song.coverUrl && <span style={{ fontSize: '18px' }}>🎵</span>}
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/music/${song.slug || song._id}`} style={{ color: '#fff', textDecoration: 'none', display: 'block' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{song.year} • {song.genre}</div>
                    </Link>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {song.mediaUrl && (
                      <Link href={`/music/${song.slug || song._id}`} title="Listen"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </Link>
                    )}
                    {(song.downloadUrl || song.mediaUrl) && (
                      <TrackAction songId={song._id.toString()} action="download" href={`/api/songs/${song._id.toString()}/download`} download title="Download"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', color: '#FF6B00' }}>
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
    </div>
  );
}
