import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Song from '@/models/Song';
import Video from '@/models/Video';

export const revalidate = 60; // Cache stats for 60 seconds

export async function GET() {
  try {
    await dbConnect();
    
    // Run counts concurrently
    const [postsCount, songsCount, videosCount] = await Promise.all([
      Post.countDocuments({ status: 'published' }),
      Song.countDocuments(),
      Video.countDocuments()
    ]);

    return NextResponse.json({
      posts: postsCount,
      songs: songsCount,
      videos: videosCount
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
