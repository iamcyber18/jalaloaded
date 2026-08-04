import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Album from '@/models/Album';
import Song from '@/models/Song';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const artist = searchParams.get('artist');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '30');

    const query: any = {};
    if (artist) {
      query.artist = new RegExp(artist, 'i');
    }
    if (type) {
      query.type = type;
    }

    const albums = await Album.find(query)
      .sort({ year: -1, createdAt: -1 })
      .limit(limit);

    return NextResponse.json(albums);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.slug && body.artist && body.title) {
      const base = `${body.artist}-${body.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      body.slug = `${base}-${Date.now().toString(36)}`;
    }

    const newAlbum = new Album(body);
    await newAlbum.save();

    return NextResponse.json(newAlbum, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
