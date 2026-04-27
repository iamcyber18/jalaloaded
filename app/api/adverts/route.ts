import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Advert from '@/models/Advert';

// GET - fetch adverts (optional: filter by placement, active only)
export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');
    const activeOnly = searchParams.get('active') !== 'false';

    const query: any = {};
    if (placement) query.placement = placement;
    if (activeOnly) {
      query.isActive = true;
      // Only show ads within their date range
      const now = new Date();
      query.$or = [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $exists: false } },
        { startDate: { $exists: false }, endDate: { $gte: now } },
      ];
    }

    const adverts = await Advert.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(adverts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch adverts' }, { status: 500 });
  }
}

// POST - create a new advert
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.title || !body.imageUrl || !body.linkUrl || !body.advertiser) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const advert = new Advert(body);
    await advert.save();

    return NextResponse.json(advert, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create advert' }, { status: 500 });
  }
}
