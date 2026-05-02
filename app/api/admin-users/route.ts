import { NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import { hashPassword } from '@/lib/password';

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const users = await AdminUser.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      users.map((user) => ({
        _id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        active: user.active,
        createdByUsername: user.createdByUsername,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }))
    );
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Failed to load sub-admins.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, displayName, password, role = 'sub-admin' } = await request.json();

    if (!username || !displayName || !password) {
      return NextResponse.json({ error: 'Username, display name, and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const normalizedUsername = normalizeUsername(username);
    if (!/^[a-z0-9._-]+$/.test(normalizedUsername)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, dots, underscores, and dashes.' }, { status: 400 });
    }

    if (normalizedUsername === normalizeUsername(process.env.ADMIN_USERNAME || 'jalal')) {
      return NextResponse.json({ error: 'That username is reserved for the main admin.' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await AdminUser.findOne({ username: normalizedUsername });
    if (existingUser) {
      return NextResponse.json({ error: 'That username is already in use.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await AdminUser.create({
      username: normalizedUsername,
      displayName: displayName.trim(),
      passwordHash,
      role: (role === 'admin') ? 'admin' : 'sub-admin',
      active: true,
      createdByUsername: session.username,
    });

    return NextResponse.json(
      {
        _id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        active: user.active,
        createdByUsername: user.createdByUsername,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin user create error:', error);
    return NextResponse.json({ error: 'Failed to create sub-admin.' }, { status: 500 });
  }
}
