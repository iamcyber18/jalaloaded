import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Video from '@/models/Video';
import { deleteCloudinaryFiles } from '@/lib/cloudinary';

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
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const body = await request.json();

    const video = await Video.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    return NextResponse.json(video);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const video = await Video.findById(resolvedParams.id);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Extract Cloudinary URLs from video
    const cloudinaryUrls: string[] = [];
    const urlFields = ['mediaUrl', 'thumbnailUrl'];
    
    urlFields.forEach(field => {
      const url = video[field as keyof typeof video] as string;
      if (url && url.includes('cloudinary.com')) {
        cloudinaryUrls.push(url);
      }
    });

    // Delete the video from database first
    await Video.findByIdAndDelete(resolvedParams.id);

    // Clean up Cloudinary files (don't fail the request if this fails)
    if (cloudinaryUrls.length > 0) {
      try {
        const cleanupResult = await deleteCloudinaryFiles(cloudinaryUrls);
        console.log(`Video Cloudinary cleanup: ${cleanupResult.success} files deleted, ${cleanupResult.failed} failed`);
      } catch (error) {
        console.error('Video Cloudinary cleanup failed:', error);
        // Don't fail the request - video is already deleted
      }
    }

    return NextResponse.json({ 
      message: 'Video deleted successfully',
      cleanedFiles: cloudinaryUrls.length 
    });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
