import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UpcomingMusic from '@/models/UpcomingMusic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const body = await request.json();

    const updated = await UpcomingMusic.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    
    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    
    const deleted = await UpcomingMusic.findByIdAndDelete(resolvedParams.id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
