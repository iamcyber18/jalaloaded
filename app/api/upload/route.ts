import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // For audio and video, Cloudinary uses 'video' resource_type
    const resourceType = type === 'image' ? 'image' : 'video';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'jalaloaded',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            resolve(NextResponse.json({ error: 'Upload failed' }, { status: 500 }));
          } else {
            resolve(
              NextResponse.json({
                url: result?.secure_url,
                publicId: result?.public_id,
                type: resourceType,
                duration: result?.duration, // usually available for audio/video
              })
            );
          }
        }
      );

      const readableStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });

      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: 'Server error during upload' }, { status: 500 });
  }
}
