import dbConnect from '@/lib/mongodb';
import LiveStream, { ILiveStream } from '@/models/LiveStream';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getFacebookEmbed(url: string) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&t=0`;
}

export default async function LivePage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  await dbConnect();
  const { v } = await searchParams;
  
  const activeStreams = await LiveStream.find({ isActive: true }).sort({ updatedAt: -1 }).lean<ILiveStream[]>();
  
  // Choose which stream to play (default to first active if no ID provided)
  const selectedStream = v 
    ? activeStreams.find(s => s._id.toString() === v) || activeStreams[0]
    : activeStreams[0];

  return (
    <div className="jlh min-h-screen">
      <div className="live-container">
        <div className="live-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
             <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: activeStreams.length > 0 ? '#ff0000' : '#444', animation: activeStreams.length > 0 ? 'pulse 2s infinite' : 'none' }}></div>
             <span style={{ fontSize: '13px', fontWeight: 800, color: activeStreams.length > 0 ? '#ff0000' : 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
               {activeStreams.length > 0 ? `${activeStreams.length} Live Stream${activeStreams.length > 1 ? 's' : ''} Available` : 'Currently Offline'}
             </span>
          </div>
          <h1 className="live-title">
            {selectedStream ? selectedStream.title : 'Jalaloaded Live Session'}
          </h1>
        </div>

        {activeStreams.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: activeStreams.length > 1 ? '1fr 300px' : '1fr', gap: '32px' }} className="live-grid">
            {/* Main Player Area */}
            <div>
              <div style={{ background: '#000', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  {selectedStream.platform === 'youtube' ? (
                    <iframe
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      src={`https://www.youtube.com/embed/${getYoutubeId(selectedStream.url)}?autoplay=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <iframe 
                      src={getFacebookEmbed(selectedStream.url)}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      scrolling="no" 
                      frameBorder="0" 
                      allowFullScreen={true} 
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    ></iframe>
                  )}
                </div>
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                   <div style={{ flex: 1 }}>
                     <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{selectedStream.title}</h2>
                     <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                       {selectedStream.description || 'Welcome to our live stream! Stay tuned for the best vibes and updates.'}
                     </p>
                   </div>
                   <ShareButton title={selectedStream.title} />
                </div>
              </div>
            </div>

            {/* Sidebar with other streams */}
            {activeStreams.length > 1 && (
              <div className="live-sidebar">
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>Switch Channels</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeStreams.map(stream => (
                    <div key={stream._id.toString()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link 
                        href={`/live?v=${stream._id}`}
                        style={{ 
                          flex: 1, textDecoration: 'none', 
                          background: selectedStream._id.toString() === stream._id.toString() ? 'rgba(255,107,0,0.1)' : 'rgba(255,255,255,0.03)',
                          border: selectedStream._id.toString() === stream._id.toString() ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.06)',
                          padding: '12px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', transition: '0.2s'
                        }}
                      >
                         <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff0000', animation: 'blink 1s infinite', flexShrink: 0 }}></div>
                         <div style={{ flex: 1, minWidth: 0 }}>
                           <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stream.title}</div>
                           <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{stream.platform} Channel</div>
                         </div>
                      </Link>
                      <ShareButton 
                        title={stream.title} 
                        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/live?v=${stream._id}`} 
                        mini 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            padding: '100px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', 
            border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '24px' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎥</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>No Active Stream</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '400px', margin: '0 auto 24px' }}>
              We are currently not live. Follow us on social media to get notified when we start our next session!
            </p>
            <Link href="/" style={{ background: 'var(--orange)', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
              Back to Home
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
