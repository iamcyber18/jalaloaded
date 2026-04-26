import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    
    const song = await Song.findByIdAndUpdate(
      resolvedParams.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json({ mediaUrl: song.mediaUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record download' }, { status: 500 });
  }
}
