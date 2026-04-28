import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { notFound } from 'next/navigation';
import { formatNumber } from '@/lib/utils';
import TrackAction from '@/components/TrackAction';
import ShareButton from '@/components/ShareButton';
import LikeButton from '@/components/LikeButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getSong(slug: string) {
  await dbConnect();
  // Try slug first, then _id for backwards compat
  let song = await Song.findOne({ slug }).lean();
  if (!song) {
    try { song = await Song.findById(slug).lean(); } catch {}
  }
  if (!song) return null;

  // Get more songs from same artist
  const moreSongs = await Song.find({ artist: song.artist, _id: { $ne: song._id } })
    .sort({ createdAt: -1 }).limit(4).lean();

  // Increment plays
  await Song.findByIdAndUpdate(song._id, { $inc: { plays: 1 } });

  return {
    song: JSON.parse(JSON.stringify(song)),
    moreSongs: JSON.parse(JSON.stringify(moreSongs)),
  };
}

export default async function SongPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSong(slug);
  if (!data) notFound();

  const { song, moreSongs } = data;

  return (
    <div className="jlh" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* HERO */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(255,107,0,0.1) 0%, transparent 60%)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '48px 0 40px'
      }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-15%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,107,0,0.06), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Cover Art */}
          <div style={{
            width: '260px', height: '260px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 24px 70px rgba(0,0,0,0.5), 0 0 50px rgba(255,107,0,0.08)',
            background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {!song.coverUrl && (
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{song.genre}</span>
              <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600 }}>{song.year}</span>
              {song.featured && <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,215,0,0.1)', color: '#ffd700', fontSize: '10px', fontWeight: 700 }}>⭐ Featured</span>}
            </div>

            <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '30px', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 8px' }}>
              {song.title}
            </h1>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
              {song.artist}
            </div>
            {song.description && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, marginBottom: '18px', maxWidth: '400px' }}>
                {song.description}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '22px' }}>
              <div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: '#FF6B00' }}>{formatNumber(song.plays || 0)}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plays</div>
              </div>
              <div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: '#FF6B00' }}>{formatNumber(song.downloads || 0)}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Downloads</div>
              </div>
              <div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: '#FF6B00' }}>{formatNumber(song.likes || 0)}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Likes</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(song.downloadUrl || song.mediaUrl) && (
                <TrackAction songId={song._id} action="download" href={song.downloadUrl || song.mediaUrl} download
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '10px', background: 'linear-gradient(135deg, #FF6B00, #ff8533)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </TrackAction>
              )}
              {song.streamUrl && (
                <TrackAction songId={song._id} action="play" href={song.streamUrl}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '10px', background: 'rgba(29,190,115,0.1)', border: '1px solid rgba(29,190,115,0.2)', color: '#1DBE73', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Stream
                </TrackAction>
              )}
              <LikeButton songId={song._id} initialLikes={song.likes || 0} />
              <ShareButton title={`${song.artist} - ${song.title}`} />
            </div>
          </div>
        </div>
      </div>

      {/* MORE FROM ARTIST */}
      {moreSongs.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '32px auto 0', padding: '0 24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>More from {song.artist}</div>
          {moreSongs.map((s: any) => (
            <Link key={s._id} href={`/music/${s.slug || s._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '6px', transition: 'background 0.2s' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: s.coverUrl ? `url(${s.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!s.coverUrl && <span style={{ fontSize: '16px' }}>🎵</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{s.title}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{s.genre} • {s.year}</div>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{formatNumber(s.plays || 0)} plays</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Back to music */}
      <div style={{ maxWidth: '800px', margin: '24px auto', padding: '0 24px' }}>
        <Link href="/music" style={{ fontSize: '12px', color: '#FF6B00', textDecoration: 'none', fontWeight: 600 }}>← Back to Music</Link>
      </div>
    </div>
  );
}
