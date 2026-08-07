import dbConnect from '@/lib/mongodb';
import Album from '@/models/Album';
import Song from '@/models/Song';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getAlbumData(slug: string) {
  await dbConnect();

  let album = await Album.findOne({ slug }).lean();
  if (!album) {
    try {
      album = await Album.findById(slug).lean();
    } catch {
      album = null;
    }
  }

  if (!album) return null;

  const songs = await Song.find({ album: album.title, status: 'Published' }).sort({ createdAt: -1 }).lean();

  return {
    album: JSON.parse(JSON.stringify(album)),
    songs: JSON.parse(JSON.stringify(songs)),
  };
}

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const data = await getAlbumData(resolvedParams.slug);

  if (!data?.album) notFound();

  const { album, songs } = data;

  return (
    <div className="jlh" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <div className="page album-page-inner" style={{ maxWidth: '1100px', margin: '0 auto', paddingTop: '24px' }}>
        <Link href="/music" style={{ color: '#FF6B00', textDecoration: 'none', fontSize: '12px', fontWeight: 700, display: 'inline-block', marginBottom: '16px' }}>
          ← Back to Music
        </Link>

        <div className="album-page-grid" style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'minmax(240px, 300px) 1fr' }}>
          <div className="album-card" style={{ borderRadius: '20px', padding: '20px', background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 24px rgba(0,0,0,0.22)' }}>
            <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '16px', background: album.coverUrl ? `url(${album.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.24), rgba(255,107,0,0.08))', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              {!album.coverUrl && <span style={{ fontSize: '28px', opacity: 0.45 }}>💿</span>}
            </div>
            <div className="album-title" style={{ fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif', marginBottom: '6px' }}>{album.title}</div>
            <div className="album-artist" style={{ fontSize: '13px', color: '#FF6B00', fontWeight: 700, marginBottom: '8px' }}>{album.artist}</div>
            <div className="album-meta" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '12px' }}>{album.type || 'Album'} • {album.year || new Date(album.createdAt).getFullYear()}</div>
            <div className="album-pill-wrap" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div className="album-pill" style={{ padding: '7px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{songs.length} Tracks</div>
              <div className="album-pill" style={{ padding: '7px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{album.genre || 'Music'}</div>
            </div>
            {album.description && <div className="album-description" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{album.description}</div>}
          </div>

          <div>
            <div className="album-track-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, #FF6B00, #ff8533)' }} />
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif' }}>Tracklist</div>
            </div>

            {songs.length === 0 ? (
              <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                No songs have been added to this album yet.
              </div>
            ) : (
              songs.map((song: any, index: number) => (
                <Link key={song._id.toString()} href={`/music/${song.slug || song._id}`} style={{ textDecoration: 'none' }}>
                  <div className="album-track-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: index < songs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', transition: 'background 0.2s ease', borderRadius: '10px', paddingLeft: '6px', paddingRight: '6px' }}>
                    <div className="album-track-number" style={{ width: '28px', color: 'rgba(255,255,255,0.22)', fontWeight: 700, fontFamily: '"Bebas Neue", sans-serif', fontSize: '13px' }}>{String(index + 1).padStart(2, '0')}</div>
                    <div className="album-track-thumb" style={{ width: '44px', height: '44px', borderRadius: '10px', background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,107,0,0.06))', border: '1px solid rgba(255,255,255,0.06)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="album-track-title" style={{ fontSize: '13px', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                      <div className="album-track-subtitle" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{song.artist} • {song.genre} • {formatNumber(song.plays || 0)} plays</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
