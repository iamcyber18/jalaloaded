import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LiveStream from '@/models/LiveStream';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const streams = await LiveStream.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json(streams);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    
    // If setting to active, deactivate others
    if (body.isActive) {
      await LiveStream.updateMany({}, { isActive: false });
    }

    const stream = await LiveStream.create(body);
    return NextResponse.json(stream, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { id, ...updates } = body;

    if (updates.isActive) {
      await LiveStream.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    const stream = await LiveStream.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json(stream);
  } catch {
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 });
  }
}
