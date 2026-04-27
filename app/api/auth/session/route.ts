import { NextResponse } from 'next/server';
import { getSession, getSessionPermissions } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ session: null, permissions: null }, { status: 401 });
  }

  return NextResponse.json({
    session,
    permissions: getSessionPermissions(session),
  });
}
