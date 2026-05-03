import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Artist from '@/models/Artist';
import { deleteCloudinaryFiles } from '@/lib/cloudinary';
import Song from '@/models/Song';
import Video from '@/models/Video';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();

    const oldArtist = await Artist.findById(id);
    if (!oldArtist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

    const oldName = oldArtist.name;
    const newName = body.name;

    if (newName) {
      body.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    const artist = await Artist.findByIdAndUpdate(id, body, { new: true });
    
    // If name changed, update all songs and videos that reference the old name
    if (newName && oldName !== newName) {
      await Promise.all([
        Song.updateMany({ artist: oldName }, { artist: newName }),
        // Check videos if they have an artist field (some models might not have it explicitly but let's be safe)
        Video.updateMany({ artist: oldName }, { artist: newName })
      ]);
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error('Update artist error:', error);
    return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const artist = await Artist.findById(id);

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Extract Cloudinary URLs from artist
    const cloudinaryUrls: string[] = [];
    if (artist.image && artist.image.includes('cloudinary.com')) {
      cloudinaryUrls.push(artist.image);
    }

    // Delete the artist from database first
    await Artist.findByIdAndDelete(id);

    // Clean up Cloudinary files (don't fail the request if this fails)
    if (cloudinaryUrls.length > 0) {
      try {
        const cleanupResult = await deleteCloudinaryFiles(cloudinaryUrls);
        console.log(`Artist Cloudinary cleanup: ${cleanupResult.success} files deleted, ${cleanupResult.failed} failed`);
      } catch (error) {
        console.error('Artist Cloudinary cleanup failed:', error);
        // Don't fail the request - artist is already deleted
      }
    }

    return NextResponse.json({ 
      message: 'Artist deleted',
      cleanedFiles: cloudinaryUrls.length 
    });
  } catch (error) {
    console.error('Delete artist error:', error);
    return NextResponse.json({ error: 'Failed to delete artist' }, { status: 500 });
  }
}
