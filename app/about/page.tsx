import { formatNumber } from '@/lib/utils';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Song from '@/models/Song';
import Video from '@/models/Video';

export const dynamic = 'force-dynamic';

async function getStats() {
  await dbConnect();
  const [posts, songs, videos] = await Promise.all([
    Post.countDocuments({ status: 'published' }),
    Song.countDocuments(),
    Video.countDocuments()
  ]);
  return { posts, songs, videos };
}

export default async function AboutPage() {
  const stats = await getStats();

  return (
    <div className="jlh min-h-screen">
      <div className="page" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* HERO */}
        <div className="hero" style={{ height: '300px', cursor: 'default' }}>
          <div className="hero-img-bg"><div className="hero-pattern"></div></div>
          <div className="hero-overlay"></div>
          <div className="hero-content" style={{ textAlign: 'center', bottom: '20px' }}>
            <div className="hero-title" style={{ fontSize: '36px', marginBottom: '16px' }}>WE ARE JALALOADED</div>
            <p className="hero-date" style={{ fontSize: '14px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              The number one platform for the latest gists, music drops, and exclusive media content from the streets to the world.
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="sec-hdr" style={{ marginTop: '20px' }}>
             <div className="sec-title"><div className="sec-line"></div>Platform Impact</div>
        </div>
        <div className="posts-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div className="s-card" style={{ textAlign: 'center', padding: '24px' }}>
               <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '42px', color: '#FF6B00', lineHeight: 1 }}>{formatNumber(stats.posts)}</div>
               <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Articles</div>
            </div>
            <div className="s-card" style={{ textAlign: 'center', padding: '24px' }}>
               <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '42px', color: '#FF6B00', lineHeight: 1 }}>{formatNumber(stats.songs)}</div>
               <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Songs</div>
            </div>
            <div className="s-card" style={{ textAlign: 'center', padding: '24px' }}>
               <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '42px', color: '#FF6B00', lineHeight: 1 }}>{formatNumber(stats.videos)}</div>
               <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Videos</div>
            </div>
        </div>

        {/* AUTHORS */}
        <div className="sec-hdr" style={{ marginTop: '20px' }}>
             <div className="sec-title"><div className="sec-line"></div>The Crew</div>
        </div>
        <div className="posts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Victor Galadima */}
          <div className="s-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="hero-av" style={{ width: '48px', height: '48px', fontSize: '16px', flexShrink: 0 }}>VG</div>
                <div>
                   <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--color-text-primary)' }}>Victor Galadima <span style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>(Cyber)</span></div>
                   <div style={{ fontSize: '11px', color: '#FF6B00', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Founder, Developer & Lead Tech Writer</div>
                </div>
             </div>
             <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                A passionate Computer Science graduate from Federal University Wukari, Victor bridges the gap between technology and modern entertainment. With a sharp eye for digital trends and a deep love for the culture, he built this platform to bring the rawest, most authentic, and cutting-edge content directly to the masses.
             </div>
             <div className="socials" style={{ marginTop: 'auto' }}>
                <a href="mailto:victorlawigaladima@gmail.com" className="soc-btn" title="victorlawigaladima@gmail.com" style={{ textDecoration: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </a>
                <a href="https://www.facebook.com/search/top?q=victor%20galadima" target="_blank" rel="noopener noreferrer" className="soc-btn" title="Facebook: Victor Galadima" style={{ textDecoration: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://wa.me/2349047527504" target="_blank" rel="noopener noreferrer" className="soc-btn" title="WhatsApp: 09047527504" style={{ textDecoration: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
             </div>
          </div>

          {/* Daniel Rimamtatany */}
          <div className="s-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: 'var(--orange)', fontFamily: '"Syne", sans-serif', flexShrink: 0 }}>DR</div>
                <div>
                   <div style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--color-text-primary)' }}>Daniel Rimamtatany <span style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>(David Frank)</span></div>
                   <div style={{ fontSize: '11px', color: '#FF6B00', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Co-founder & Creative Editor</div>
                </div>
             </div>
             <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Also a Computer Science alumnus of Federal University Wukari, Daniel is the creative mastermind behind the platform's deep dives and editorial pieces. He combines his technical expertise with a unique storytelling ability, bringing readers the crucial insights and fresh perspectives they didn't know they needed.
             </div>
             <div className="socials" style={{ marginTop: 'auto' }}>
                <div className="soc-btn">𝕏</div>
                <div className="soc-btn">ig</div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
