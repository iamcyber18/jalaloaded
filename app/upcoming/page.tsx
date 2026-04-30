import dbConnect from '@/lib/mongodb';
import UpcomingMusic from '@/models/UpcomingMusic';
import Link from 'next/link';
import CountdownTimer from '@/components/CountdownTimer';

export const dynamic = 'force-dynamic';

export default async function UpcomingPage() {
  await dbConnect();
  
  // Sort by releaseDate ascending, so the soonest drops show first
  const upcomingTracks = await UpcomingMusic.find().sort({ releaseDate: 1 }).lean();

  return (
    <div className="jlh min-h-screen">
      <div className="page" style={{ gridTemplateColumns: '1fr', maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px' }}>
          <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '48px', letterSpacing: '2px', color: 'var(--orange)' }}>Upcoming Drops</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontFamily: '"Lora", serif', marginTop: '12px', lineHeight: '1.6' }}>
            Get ready for the hottest new music hitting the streets. See exactly when your favorite tracks will be available.
          </p>
        </div>

        {/* Content Grid */}
        {upcomingTracks.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
            {upcomingTracks.map((track: any) => {
              const isOut = new Date(track.releaseDate) <= new Date();
              return (
                <div key={track._id.toString()} style={{ 
                  background: 'var(--color-background-secondary)', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  border: isOut ? '1px solid rgba(255,107,0,0.5)' : '1px solid var(--color-border-tertiary)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Cover */}
                  <div style={{ 
                    height: '240px', 
                    background: track.coverUrl ? `url(${track.coverUrl}) center/cover` : 'var(--color-background-tertiary)', 
                    position: 'relative' 
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }}></div>
                    <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        background: isOut ? '#1DBE73' : 'rgba(255,107,0,0.9)', 
                        color: '#fff', 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        borderRadius: '20px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px' 
                      }}>
                        {isOut ? 'Available Now' : 'Upcoming'}
                      </span>
                    </div>
                    {/* Audio Snippet */}
                    {track.snippetUrl && (
                      <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                        <audio controls controlsList="nodownload" style={{ height: '32px', width: '200px' }}>
                          <source src={track.snippetUrl} type="audio/mpeg" />
                          <source src={track.snippetUrl} type="audio/mp4" />
                        </audio>
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                      {track.title}
                    </h2>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--orange)', marginBottom: '16px' }}>
                      {track.artist}
                    </h3>

                    {track.description && (
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>
                        {track.description}
                      </p>
                    )}

                    {!track.description && <div style={{ flex: 1 }}></div>}

                    {/* Timer / CTA */}
                    <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <CountdownTimer targetDate={track.releaseDate.toISOString()} />
                      {isOut && (
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                          <Link href="/music" style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--orange)', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '8px', textDecoration: 'none' }}>
                            Check Music Section &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--color-background-secondary)', borderRadius: '16px', border: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎧</div>
            <h3 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>No upcoming drops right now</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Check back later for new exclusive tracks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
