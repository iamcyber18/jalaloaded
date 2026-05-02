import { NextResponse } from 'next/server';
import { getSession, getSessionPermissions } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ session: null, permissions: null }, { status: 401 });
  }

  // Fetch latest profile info if it's a database user
  let profileImageUrl = undefined;
  let displayName = session.displayName;

  if (session.userId && session.userId !== 'env-admin') {
    try {
      const dbConnect = (await import('@/lib/mongodb')).default;
      const AdminUser = (await import('@/models/AdminUser')).default;
      await dbConnect();
      const user = await AdminUser.findById(session.userId).lean();
      if (user) {
        profileImageUrl = user.profileImageUrl;
        displayName = user.displayName;
      }
    } catch (err) {
      console.error('Session DB fetch error:', err);
    }
  }

  return NextResponse.json({
    session: {
      ...session,
      profileImageUrl,
      displayName
    },
    permissions: getSessionPermissions(session),
  });
}
