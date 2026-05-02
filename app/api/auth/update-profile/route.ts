import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId || session.userId === 'env-admin') {
      return NextResponse.json({ error: 'Unauthorized or using environment admin.' }, { status: 401 });
    }

    const { profileImageUrl, displayName } = await request.json();

    await dbConnect();
    
    const updateData: any = {};
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    if (displayName) updateData.displayName = displayName;

    const user = await AdminUser.findByIdAndUpdate(
      session.userId,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
