import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { deleteCloudinaryFiles } from '@/lib/cloudinary';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    
    const song = await Song.findById(resolvedParams.id).lean();

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const body = await request.json();

    const song = await Song.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    });

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const song = await Song.findById(resolvedParams.id);

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Extract Cloudinary URLs from song
    const cloudinaryUrls = Array.from(new Set(
      ['mediaUrl', 'streamUrl', 'downloadUrl', 'coverUrl', 'videoUrl']
        .flatMap(field => {
          const value = song[field as keyof typeof song];
          return typeof value === 'string' && value.includes('cloudinary.com') ? [value] : [];
        })
    ));

    // Delete the song from database first
    await Song.findByIdAndDelete(resolvedParams.id);

    // Clean up Cloudinary files (don't fail the request if this fails)
    if (cloudinaryUrls.length > 0) {
      try {
        const cleanupResult = await deleteCloudinaryFiles(cloudinaryUrls);
        console.log(`Song Cloudinary cleanup: ${cleanupResult.success} files deleted, ${cleanupResult.failed} failed`);
      } catch (error) {
        console.error('Song Cloudinary cleanup failed:', error);
        // Don't fail the request - song is already deleted
      }
    }

    return NextResponse.json({ 
      message: 'Song deleted successfully',
      cleanedFiles: cloudinaryUrls.length 
    });
  } catch (error) {
    console.error('Delete song error:', error);
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const { action } = await request.json();

    const field = action === 'play' ? 'plays' : action === 'download' ? 'downloads' : action === 'like' ? 'likes' : null;
    if (!field) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const song = await Song.findByIdAndUpdate(
      resolvedParams.id,
      { $inc: { [field]: 1 } },
      { new: true }
    );

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json({ [field]: song[field as keyof typeof song] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track action' }, { status: 500 });
  }
}
