import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Newsletter from '@/models/Newsletter';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    try {
      const entry = new Newsletter({ email });
      await entry.save();
      return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
    } catch (err: any) {
      if (err.code === 11000) {
        return NextResponse.json({ message: 'Email already subscribed' }, { status: 200 });
      }
      throw err;
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
