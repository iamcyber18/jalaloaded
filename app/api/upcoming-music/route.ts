import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UpcomingMusic from '@/models/UpcomingMusic';

export async function GET() {
  try {
    await dbConnect();
    // Sort by releaseDate ascending so the soonest drops are first
    const upcoming = await UpcomingMusic.find().sort({ releaseDate: 1 });
    return NextResponse.json(upcoming);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch upcoming music' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const newItem = new UpcomingMusic(body);
    await newItem.save();
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create upcoming music' }, { status: 500 });
  }
}
