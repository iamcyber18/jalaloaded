import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();

    const post = await Post.findByIdAndUpdate(
      resolvedParams.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ likes: post.likes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
