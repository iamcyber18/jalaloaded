import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Artist from '@/models/Artist';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();

    if (body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    const artist = await Artist.findByIdAndUpdate(id, body, { new: true });
    if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    return NextResponse.json(artist);
  } catch {
    return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const artist = await Artist.findByIdAndDelete(id);
    if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    return NextResponse.json({ message: 'Artist deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete artist' }, { status: 500 });
  }
}
