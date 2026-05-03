import dbConnect from '@/lib/mongodb';
import LiveStream from '@/models/LiveStream';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getFacebookEmbed(url: string) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&t=0`;
}

export default async function LivePage() {
  await dbConnect();
  const activeStream = await LiveStream.findOne({ isActive: true }).lean();

  return (
    <div className="jlh min-h-screen">
      <div className="live-container">
        <div className="live-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
             <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: activeStream ? '#ff0000' : '#444', animation: activeStream ? 'pulse 2s infinite' : 'none' }}></div>
             <span style={{ fontSize: '13px', fontWeight: 800, color: activeStream ? '#ff0000' : 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
               {activeStream ? 'Live Now' : 'Currently Offline'}
             </span>
          </div>
          <h1 className="live-title">
            {activeStream ? activeStream.title : 'Jalaloaded Live Session'}
          </h1>
        </div>

        {activeStream ? (
          <div style={{ background: '#000', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              {activeStream.platform === 'youtube' ? (
                <iframe
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  src={`https://www.youtube.com/embed/${getYoutubeId(activeStream.url)}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <iframe 
                  src={getFacebookEmbed(activeStream.url)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  scrolling="no" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                ></iframe>
              )}
            </div>
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
               <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                 {activeStream.description || 'Welcome to our live stream! Stay tuned for the best vibes and updates.'}
               </p>
            </div>
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
