import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { isAdminAuthenticated } from '@/lib/auth';

const MEDIA_FOLDER = 'jalaloaded';
const allowedResourceTypes = new Set(['image', 'video']);

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { resourceType?: string };
    const resourceType = body.resourceType || 'image';

    if (!allowedResourceTypes.has(resourceType)) {
      return NextResponse.json({ error: 'Unsupported upload type' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary is not configured' }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        folder: MEDIA_FOLDER,
        timestamp,
      },
      apiSecret
    );

    return NextResponse.json({
      apiKey,
      cloudName,
      folder: MEDIA_FOLDER,
      resourceType,
      signature,
      timestamp,
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    return NextResponse.json({ error: 'Unable to prepare upload' }, { status: 500 });
  }
}
