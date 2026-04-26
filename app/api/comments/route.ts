import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Fetch all comments for the post
    const comments = await Comment.find({ postId }).sort({ createdAt: -1 }).lean();

    // Organize into threaded structure (top-level vs replies)
    const topLevel: any[] = [];
    const repliesMap: { [key: string]: any[] } = {};

    comments.forEach((c: any) => {
      const commentData = { ...c, replies: [] };
      if (c.parentId) {
        const parentStr = c.parentId.toString();
        if (!repliesMap[parentStr]) repliesMap[parentStr] = [];
        repliesMap[parentStr].push(commentData);
      } else {
        topLevel.push(commentData);
      }
    });

    // Attach replies to parents
    topLevel.forEach((c) => {
      const idStr = c._id.toString();
      if (repliesMap[idStr]) {
        // Sort replies oldest first (chronological thread)
        c.replies = repliesMap[idStr].sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
      }
    });

    return NextResponse.json(topLevel);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Basic validation
    if (!body.postId || !body.name || !body.body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newComment = new Comment(body);
    await newComment.save();
    
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
