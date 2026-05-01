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
        <div className="hero about-hero" style={{ cursor: 'default' }}>
          <div className="hero-img-bg"><div className="hero-pattern"></div></div>
          <div className="hero-overlay"></div>
          <div className="hero-content" style={{ textAlign: 'center', bottom: '20px' }}>
            <div className="hero-title about-hero-title">WE ARE JALALOADED</div>
            <p className="hero-date about-hero-desc">
              The number one platform for the latest gists, music drops, and exclusive media content from the streets to the world.
            </p>
          </div>
        </div>

        {/* ABOUT CONTENT */}
        <div className="sec-hdr" style={{ marginTop: '40px' }}>
             <div className="sec-title"><div className="sec-line"></div>Our Mission</div>
        </div>
        <div className="s-card" style={{ padding: '32px', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
          <p style={{ marginBottom: '20px' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Jalaloaded</strong> is more than just a blog—it's a digital hub built for the culture. We are dedicated to delivering the most accurate, engaging, and up-to-the-minute content across entertainment, lifestyle, music, and hard-hitting news. 
          </p>
          <p style={{ marginBottom: '20px' }}>
            Born from a passion to amplify voices and highlight the rawest talent, our platform bridges the gap between mainstream media and underground culture. Whether you're here to discover the next big artist, catch up on the latest trends, or read thought-provoking editorials, Jalaloaded is your ultimate destination.
          </p>
          <p>
            Our commitment is to keep you loaded with premium, unfiltered content that resonates with the streets and the world at large. Welcome to the movement.
          </p>
        </div>

      </div>
    </div>
  );
}
