import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Artist from '@/models/Artist';

export async function GET() {
  try {
    await dbConnect();
    const artists = await Artist.find().sort({ name: 1 }).lean();
    return NextResponse.json(artists);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Artist name is required' }, { status: 400 });
    }

    // Auto-generate slug
    body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if artist already exists
    const existing = await Artist.findOne({ name: body.name });
    if (existing) {
      return NextResponse.json({ error: 'Artist already exists' }, { status: 409 });
    }

    const artist = new Artist(body);
    await artist.save();
    return NextResponse.json(artist, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create artist' }, { status: 500 });
  }
}
