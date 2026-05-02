import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileImageUrl, displayName } = await request.json();

    await dbConnect();
    
    let user;
    if (session.userId && session.userId !== 'env-admin') {
      user = await AdminUser.findById(session.userId);
    } else {
      user = await AdminUser.findOne({ username: session.username.toLowerCase() });
    }

    if (!user) {
      // Create record if it doesn't exist (emergency onboard)
      user = await AdminUser.create({
        username: session.username.toLowerCase(),
        displayName: session.displayName,
        passwordHash: 'environment-protected',
        role: session.role,
        active: true,
        createdByUsername: 'system'
      });
    }

    if (profileImageUrl !== undefined) user.profileImageUrl = profileImageUrl;
    if (displayName) user.displayName = displayName;
    await user.save();

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
