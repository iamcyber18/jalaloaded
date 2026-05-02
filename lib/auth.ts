import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import { verifyPassword } from '@/lib/password';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jalaloaded-super-secret-key-change-me-2025'
);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'jalal';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'jalal2025';
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || 'Main Admin';

export type AdminRole = 'admin' | 'sub-admin';

export type AdminSession = {
  username: string;
  displayName: string;
  role: AdminRole;
  userId?: string;
};

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function createToken(session: AdminSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.username !== 'string' || typeof payload.role !== 'string') {
      return null;
    }

    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function authenticateUser(username: string, password: string) {
  const normalizedUsername = normalizeUsername(username);

  if (normalizedUsername === normalizeUsername(ADMIN_USERNAME) && password === ADMIN_PASSWORD) {
    await dbConnect();
    let user = await AdminUser.findOne({ username: normalizedUsername });
    
    if (!user) {
      // Create a database record for the environment admin to support profile pics
      user = await AdminUser.create({
        username: normalizedUsername,
        displayName: ADMIN_DISPLAY_NAME,
        passwordHash: 'environment-protected', // Password is still verified against ENV
        role: 'admin',
        active: true,
        createdByUsername: 'system',
      });
    }

    return {
      username: user.username,
      displayName: user.displayName,
      role: 'admin' as const,
      userId: user._id.toString(),
    };
  }

  await dbConnect();
  const user = await AdminUser.findOne({ username: normalizedUsername, active: true }).lean();

  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  await AdminUser.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    userId: user._id.toString(),
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function isAdminAuthenticated() {
  const session = await getSession();
  return Boolean(session && (session.role === 'admin' || session.role === 'sub-admin'));
}

export function isSuperAdmin(session: AdminSession | null) {
  return Boolean(session && session.role === 'admin');
}

export function getSessionPermissions(session: AdminSession | null) {
  if (!session) {
    return null;
  }

  return {
    canCreatePosts: true,
    canAllowComments: true,
    canFeaturePosts: true,
    canViewOwnPostsOnly: session.role === 'sub-admin',
    canChangePassword: session.role === 'sub-admin',
    canManageSubAdmins: session.role === 'admin',
    canManageAdverts: session.role === 'admin',
  };
}
