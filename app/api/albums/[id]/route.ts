import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Album from '@/models/Album';
import Song from '@/models/Song';
import { deleteCloudinaryFiles } from '@/lib/cloudinary';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const album = await Album.findById(resolvedParams.id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    await Song.updateMany(
      { album: album.title },
      { $set: { album: '', albumType: 'Single' } }
    );

    const cloudinaryUrls = Array.from(new Set(
      [album.coverUrl]
        .filter((value): value is string => typeof value === 'string' && value.includes('cloudinary.com'))
    ));

    await Album.findByIdAndDelete(resolvedParams.id);

    if (cloudinaryUrls.length > 0) {
      try {
        const cleanupResult = await deleteCloudinaryFiles(cloudinaryUrls);
        console.log(`Album Cloudinary cleanup: ${cleanupResult.success} files deleted, ${cleanupResult.failed} failed`);
      } catch (error) {
        console.error('Album Cloudinary cleanup failed:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
