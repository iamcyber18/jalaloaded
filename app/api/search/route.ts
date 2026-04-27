import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Song from '@/models/Song';
import Video from '@/models/Video';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ posts: [], songs: [], videos: [] });
    }

    await dbConnect();

    const regex = new RegExp(q, 'i');

    const [posts, songs, videos] = await Promise.all([
      Post.find({
        status: 'published',
        $or: [
          { title: regex },
          { body: regex },
          { category: regex },
          { tags: regex },
        ],
      })
        .select('title slug category createdAt media')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Song.find({
        $or: [{ title: regex }, { artist: regex }, { genre: regex }],
      })
        .select('title artist genre mediaUrl')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Video.find({
        $or: [{ title: regex }],
      })
        .select('title mediaUrl thumbnailUrl')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({ posts, songs, videos });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
