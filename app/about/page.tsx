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
                   <div style={{ fontSize: '11px', color: '#FF6B00', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Founder & Lead Tech Writer</div>
                </div>
             </div>
             <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                A passionate Computer Science graduate from Federal University Wukari, Victor bridges the gap between technology and modern entertainment. With a sharp eye for digital trends and a deep love for the culture, he built this platform to bring the rawest, most authentic, and cutting-edge content directly to the masses.
             </div>
             <div className="socials" style={{ marginTop: 'auto' }}>
                <div className="soc-btn">𝕏</div>
                <div className="soc-btn">ig</div>
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
