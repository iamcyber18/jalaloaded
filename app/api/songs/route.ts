import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';

import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isAdmin = searchParams.get('admin') === 'true';

    const query: any = {};
    if (genre && genre !== 'All') {
      query.genre = genre;
    }

    // Admin can see all songs if they have a valid token
    if (isAdmin) {
      const cookieStore = await cookies();
      const token = cookieStore.get('admin_token')?.value;
      if (!token) {
        query.status = 'Published'; // Fallback to public if no token
      }
    } else {
      query.status = 'Published';
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

    // Trigger instant search engine indexing
    import('@/lib/searchIndexPing')
      .then(({ notifySearchEngines }) => notifySearchEngines(`/music/${newSong.slug}`))
      .catch(() => {});

    return NextResponse.json(newSong, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 });
  }
}

