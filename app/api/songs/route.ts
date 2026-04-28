import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (genre && genre !== 'All') {
      query.genre = genre;
    }

    const songs = await Song.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(songs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Auto-generate slug
    if (!body.slug && body.artist && body.title) {
      const base = `${body.artist}-${body.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      body.slug = `${base}-${Date.now().toString(36)}`;
    }

    const newSong = new Song(body);
    await newSong.save();
    return NextResponse.json(newSong, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 });
  }
}
