import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Newsletter from '@/models/Newsletter';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Support basic search
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    
    let query = {};
    if (search) {
      query = { email: { $regex: search, $options: 'i' } };
    }
    
    const subscribers = await Newsletter.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ subscribers }, { status: 200 });
  } catch (error) {
    console.error('Newsletter list fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

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

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    await dbConnect();
    const deleted = await Newsletter.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Subscriber successfully removed' }, { status: 200 });
  } catch (error) {
    console.error('Newsletter delete error:', error);
    return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });
  }
}

