import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { deleteCloudinaryFiles } from '@/lib/cloudinary';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    
    // Attempt to match by id or slug
    const query = resolvedParams.id.match(/^[0-9a-fA-F]{24}$/) ? { _id: resolvedParams.id } : { slug: resolvedParams.id };
    
    const post = await Post.findOneAndUpdate(
      query,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    await dbConnect();
    const body = await request.json();
    const existingPost = await Post.findById(resolvedParams.id);

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (session.role === 'sub-admin' && existingPost.createdByUsername !== session.username) {
      return NextResponse.json({ error: 'You can only edit your own posts.' }, { status: 403 });
    }
    
    // Do not allow slug to be freely updated by client
    delete body.slug; 
    delete body.createdByUsername;
    delete body.createdByRole;

    if (session.role === 'sub-admin') {
      body.author = session.displayName || session.username;
      body.createdByUsername = session.username;
      body.createdByRole = session.role;
    }

    const nextStatus =
      body.status === 'draft' ? 'draft' : body.status === 'published' ? 'published' : existingPost.status;

    if (nextStatus === 'published' && (existingPost.status !== 'published' || !existingPost.publishedAt)) {
      body.publishedAt = new Date();
    }

    const post = await Post.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Multiple posts can be featured simultaneously for the carousel

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    await dbConnect();
    const post = await Post.findById(resolvedParams.id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (session.role === 'sub-admin' && post.createdByUsername !== session.username) {
      return NextResponse.json({ error: 'You can only delete your own posts.' }, { status: 403 });
    }

    // Extract Cloudinary URLs from post media
    const cloudinaryUrls: string[] = [];
    if (post.media && post.media.length > 0) {
      post.media.forEach(mediaItem => {
        // Check if URL is from Cloudinary
        if (mediaItem.url && mediaItem.url.includes('cloudinary.com')) {
          cloudinaryUrls.push(mediaItem.url);
        }
        // Also check thumbnail URLs
        if (mediaItem.thumbnailUrl && mediaItem.thumbnailUrl.includes('cloudinary.com')) {
          cloudinaryUrls.push(mediaItem.thumbnailUrl);
        }
      });
    }

    // Delete the post from database first
    await Post.findByIdAndDelete(resolvedParams.id);

    // Clean up Cloudinary files (don't fail the request if this fails)
    if (cloudinaryUrls.length > 0) {
      try {
        const cleanupResult = await deleteCloudinaryFiles(cloudinaryUrls);
        console.log(`Cloudinary cleanup: ${cleanupResult.success} files deleted, ${cleanupResult.failed} failed`);
      } catch (error) {
        console.error('Cloudinary cleanup failed:', error);
        // Don't fail the request - post is already deleted
      }
    }

    return NextResponse.json({ 
      message: 'Post deleted successfully',
      cleanedFiles: cloudinaryUrls.length 
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
