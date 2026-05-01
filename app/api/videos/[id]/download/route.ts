import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Video from '@/models/Video';
import Song from '@/models/Song';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();

    let video: any = await Video.findById(resolvedParams.id);
    let isSong = false;
    
    if (!video) {
      // Fallback to Song
      const song = await Song.findById(resolvedParams.id);
      if (song && song.videoUrl) {
        video = {
          title: `${song.artist} - ${song.title} (Official Video)`,
          mediaUrl: song.videoUrl
        };
        isSong = true;
      }
    }

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (!video.mediaUrl) {
      return NextResponse.json({ error: 'No video file' }, { status: 404 });
    }

    if (video.mediaUrl.includes('youtube.com') || video.mediaUrl.includes('youtu.be') || video.mediaUrl.includes('facebook.com') || video.mediaUrl.includes('tiktok.com') || video.mediaUrl.includes('vimeo.com')) {
      return NextResponse.json({ error: 'Cannot download embedded videos directly' }, { status: 400 });
    }

    // Fetch the target file
    const fileRes = await fetch(video.mediaUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
    }

    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
    const contentType = fileRes.headers.get('content-type') || 'video/mp4';

    // Build filename
    const ext = video.mediaUrl.includes('.webm') ? '.webm' : '.mp4';
    const safeName = `[Jalaloaded.com] ${video.title}`.replace(/[^a-zA-Z0-9\s\-_.[\]()]/g, '').trim();
    const filename = `${safeName}${ext}`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
