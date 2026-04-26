import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Video from '@/models/Video';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const video = await Video.findByIdAndUpdate(
      resolvedParams.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) {
       return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    return NextResponse.json(video);
  } catch (error) {
     return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const video = await Video.findByIdAndDelete(resolvedParams.id);
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
