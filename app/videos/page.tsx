import dbConnect from '@/lib/mongodb';
import Video from '@/models/Video';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

import Song from '@/models/Song';

async function getVideos(page: number, category?: string) {
  await dbConnect();
  
  const limit = 12;
  const skip = (page - 1) * limit;
  const query: any = {};
  
  if (category && category !== 'All') {
     query.category = category;
  }

  // Fetch standard videos
  const videos = await Video.find(query).lean();

  // Fetch songs with videos if category matches
  let mappedSongs: any[] = [];
  if (!category || category === 'All' || category === 'Music Videos') {
    const songsWithVideos = await Song.find({ videoUrl: { $exists: true, $ne: '' } }).lean();
    mappedSongs = songsWithVideos.map(song => ({
      _id: song._id,
      title: `${song.artist} - ${song.title} (Official Video)`,
      mediaUrl: song.videoUrl,
      thumbnailUrl: song.coverUrl,
      duration: song.duration || 0,
      description: song.description,
      author: 'jalal',
      views: song.plays,
      likes: song.likes,
      category: 'Music Videos',
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
      isSongVideo: true,
      slug: song.slug || song._id
    }));
  }

  // Combine and sort
  const allCombined = [...videos, ...mappedSongs]
    .sort((a, b) => new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime());

  // Paginate manually
  const paginatedVideos = allCombined.slice(skip, skip + limit);
  const total = allCombined.length;

  return {
    videos: JSON.parse(JSON.stringify(paginatedVideos)),
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string, category?: string }>
}) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const category = resolvedParams.category || 'All';
  
  const { videos, totalPages, currentPage } = await getVideos(page, category);
  
  const categories = ['All', 'Music Videos', 'Comedy', 'Interviews', 'Sports Highlights'];

  return (
    <div className="jlh min-h-screen">
      <div className="page" style={{ gridTemplateColumns: '1fr', maxWidth: '1240px', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
          <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '48px', letterSpacing: '2px', color: 'var(--orange)' }}>JALALOADED TV</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontFamily: '"Lora", serif', marginTop: '12px', lineHeight: '1.6' }}>The hottest visuals, street interviews, and exclusive behind-the-scenes.</p>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          {categories.map((cat) => (
            <Link 
              key={cat} 
              href={cat !== 'All' ? `/videos?category=${cat}` : '/videos'}
              className="tag-pill"
              style={{
                textDecoration: 'none',
                background: category === cat ? 'var(--orange)' : 'transparent',
                color: category === cat ? '#fff' : 'var(--color-text-secondary)',
                borderColor: category === cat ? 'var(--orange)' : 'var(--color-border-secondary)'
              }}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Content Grid */}
        {videos.length > 0 ? (
           <div className="video-grid">
             {videos.map((video: any) => (
               <VideoCard key={video._id.toString()} video={video} />
             ))}
           </div>
        ) : (
           <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--color-background-primary)', borderRadius: '14px', border: '0.5px solid var(--color-border-tertiary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎥</div>
              <h3 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>No videos found</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Looks like we haven't uploaded anything in this category yet.</p>
           </div>
        )}

        {/* Pagination Setup */}
        {totalPages > 1 && (
          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Link
                key={i}
                href={`/videos?page=${i + 1}${category !== 'All' ? '&category=' + category : ''}`}
                style={{
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px',
                  fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '13px',
                  textDecoration: 'none',
                  border: '1px solid',
                  background: currentPage === i + 1 ? 'var(--orange)' : 'var(--color-background-primary)',
                  color: currentPage === i + 1 ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: currentPage === i + 1 ? 'var(--orange)' : 'var(--color-border-tertiary)',
                }}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
