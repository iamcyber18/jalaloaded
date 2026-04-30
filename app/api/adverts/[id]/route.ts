import { NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Advert from '@/models/Advert';
import { deleteCloudinaryFiles } from '@/lib/cloudinary';

// PUT - update an advert
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();

    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const body = await request.json();

    const advert = await Advert.findByIdAndUpdate(id, body, { new: true });
    if (!advert) return NextResponse.json({ error: 'Advert not found' }, { status: 404 });

    return NextResponse.json(advert);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update advert' }, { status: 500 });
  }
}

// DELETE - remove an advert
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();

    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const advert = await Advert.findById(id);
    if (!advert) {
      return NextResponse.json({ error: 'Advert not found' }, { status: 404 });
    }

    // Extract Cloudinary URLs from advert
    const cloudinaryUrls: string[] = [];
    if (advert.imageUrl && advert.imageUrl.includes('cloudinary.com')) {
      cloudinaryUrls.push(advert.imageUrl);
    }

    // Delete the advert from database first
    await Advert.findByIdAndDelete(id);

    // Clean up Cloudinary files (don't fail the request if this fails)
    if (cloudinaryUrls.length > 0) {
      try {
        const cleanupResult = await deleteCloudinaryFiles(cloudinaryUrls);
        console.log(`Advert Cloudinary cleanup: ${cleanupResult.success} files deleted, ${cleanupResult.failed} failed`);
      } catch (error) {
        console.error('Advert Cloudinary cleanup failed:', error);
        // Don't fail the request - advert is already deleted
      }
    }

    return NextResponse.json({ 
      success: true,
      cleanedFiles: cloudinaryUrls.length 
    });
  } catch (error) {
    console.error('Delete advert error:', error);
    return NextResponse.json({ error: 'Failed to delete advert' }, { status: 500 });
  }
}

// POST - track a click
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();

    await Advert.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
