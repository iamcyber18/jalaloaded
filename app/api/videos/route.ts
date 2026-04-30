import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Video from '@/models/Video';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Auto-generate thumbnail for YouTube videos if not provided
    if (!body.thumbnailUrl && body.mediaUrl) {
      const isYouTube = body.mediaUrl.includes('youtube.com') || body.mediaUrl.includes('youtu.be');
      if (isYouTube) {
        // Extract YouTube ID and generate thumbnail
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
          /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
          const match = body.mediaUrl.match(pattern);
          if (match && match[1]) {
            body.thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
            break;
          }
        }
      }
    }
    
    const newVideo = new Video(body);
    await newVideo.save();
    return NextResponse.json(newVideo, { status: 201 });
  } catch (error) {
    console.error('Video creation error:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
