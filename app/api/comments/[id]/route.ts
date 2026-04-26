import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const comment = await Comment.findByIdAndDelete(resolvedParams.id);
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Optionally delete all nested replies here if needed
    if (!comment.parentId) {
       await Comment.deleteMany({ parentId: comment._id });
    }

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
