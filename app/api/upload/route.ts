import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { Readable } from 'stream';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!type || !['image', 'video'].includes(type)) {
      return NextResponse.json({ error: 'Invalid file type specified' }, { status: 400 });
    }

    // File size validation
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size: ${type === 'video' ? '50MB' : '10MB'}` 
      }, { status: 400 });
    }

    // File type validation
    const validVideoTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime', 'video/mpeg',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'
    ];
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (type === 'video' && !validVideoTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid format. Supported formats: MP4, WebM, OGG, AVI, MOV, MPEG, MP3, WAV, M4A' 
      }, { status: 400 });
    }
    
    if (type === 'image' && !validImageTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid image format. Supported formats: JPEG, PNG, GIF, WebP' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // For audio and video, Cloudinary uses 'video' resource_type
    const resourceType = type === 'image' ? 'image' : 'video';

    return new Promise<NextResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'jalaloaded',
          // Add transformation options for videos
          ...(type === 'video' && {
            eager: [
              { quality: 'auto', fetch_format: 'auto' }
            ],
            eager_async: true
          })
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Upload failed';
            if (error.message?.includes('File size too large')) {
              errorMessage = `File too large for Cloudinary. Maximum size: ${type === 'video' ? '50MB' : '10MB'}`;
            } else if (error.message?.includes('Invalid')) {
              errorMessage = 'Invalid file format or corrupted file';
            } else if (error.message?.includes('timeout')) {
              errorMessage = 'Upload timeout. Please try with a smaller file';
            }
            
            resolve(NextResponse.json({ error: errorMessage }, { status: 500 }));
          } else if (!result) {
            resolve(NextResponse.json({ error: 'Upload failed - no result from Cloudinary' }, { status: 500 }));
          } else {
            resolve(
              NextResponse.json({
                url: result.secure_url,
                publicId: result.public_id,
                type: resourceType,
                duration: result.duration, // usually available for audio/video
                format: result.format,
                bytes: result.bytes
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
    
    // Handle specific errors
    let errorMessage = 'Server error during upload';
    if (error instanceof Error) {
      if (error.message.includes('PayloadTooLargeError')) {
        errorMessage = 'File too large for server. Please use a smaller file.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timeout. Please try again with a smaller file.';
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
