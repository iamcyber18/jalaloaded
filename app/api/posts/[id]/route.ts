import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { isAdminAuthenticated } from '@/lib/auth';

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
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    await dbConnect();
    const body = await request.json();
    
    // Do not allow slug to be freely updated by client
    delete body.slug; 

    const post = await Post.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (body.featured) {
      await Post.updateMany(
        { _id: { $ne: post._id } },
        { $set: { featured: false } }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    await dbConnect();
    const post = await Post.findByIdAndDelete(resolvedParams.id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
