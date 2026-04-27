import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'sub-admin') {
      return NextResponse.json({ error: 'This password is managed by the main admin setup.' }, { status: 403 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    await dbConnect();
    const user = await AdminUser.findOne({ username: session.username });

    if (!user) {
      return NextResponse.json({ error: 'Sub-admin account not found.' }, { status: 404 });
    }

    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Unable to change password right now.' }, { status: 500 });
  }
}
