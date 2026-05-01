import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Video from '@/models/Video';
import Song from '@/models/Song';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // 1. Fetch standard videos
    const rawVideos = await Video.find().lean();
    
    // 2. Fetch songs that have a music video
    const songsWithVideos = await Song.find({ videoUrl: { $exists: true, $ne: '' } }).lean();

    // 3. Map songs to Video-like objects
    const mappedSongs = songsWithVideos.map(song => ({
      _id: song._id,
      title: `${song.artist} - ${song.title} (Official Video)`,
      mediaUrl: song.videoUrl,
      thumbnailUrl: song.coverUrl,
      duration: song.duration || 0,
      description: song.description,
      author: 'jalal',
      views: song.plays, // use song plays as video views proxy
      likes: song.likes,
      category: 'Music Videos',
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
      isSongVideo: true,
      slug: song.slug || song._id
    }));

    // Combine, sort, and slice
    const combinedVideos = [...rawVideos, ...mappedSongs]
      .sort((a, b) => new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime())
      .slice(0, limit);

    return NextResponse.json(combinedVideos);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Auto-generate thumbnail for supported platforms if not provided
    if (!body.thumbnailUrl && body.mediaUrl) {
      const isYouTube = body.mediaUrl.includes('youtube.com') || body.mediaUrl.includes('youtu.be');
      const isFacebook = body.mediaUrl.includes('facebook.com') || body.mediaUrl.includes('fb.watch');
      const isTikTok = body.mediaUrl.includes('tiktok.com');
      
      if (isYouTube) {
        // Extract YouTube ID and generate thumbnail
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
          /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
          /youtube\.com\/shorts\/([^&\n?#]+)/,
          /m\.youtube\.com\/watch\?v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
          const match = body.mediaUrl.match(pattern);
          if (match && match[1]) {
            body.thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
            break;
          }
        }
      }
      
      // Note: Facebook and TikTok don't provide easy thumbnail URL generation
      // These platforms require API access or custom thumbnail uploads
      // For now, we'll rely on custom thumbnails for these platforms
    }
    
    const newVideo = new Video(body);
    await newVideo.save();
    return NextResponse.json(newVideo, { status: 201 });
  } catch (error) {
    console.error('Video creation error:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
