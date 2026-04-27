import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jalaloaded-super-secret-key-change-me-2025'
);

const SUB_ADMIN_DEFAULT_ROUTE = '/admin/dashboard';
const SUPER_ADMIN_ONLY_PATHS = ['/admin/adverts', '/admin/users'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (not the login page)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (
        payload.role === 'sub-admin' &&
        SUPER_ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path))
      ) {
        return NextResponse.redirect(new URL(SUB_ADMIN_DEFAULT_ROUTE, request.url));
      }

      return NextResponse.next();
    } catch {
      // Invalid/expired token — redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.set('admin_token', '', { maxAge: 0 });
      return response;
    }
  }

  // If user is logged in and hits /admin/login, redirect to /admin
  if (pathname === '/admin/login') {
    const token = request.cookies.get('admin_token')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const redirectPath = payload.role === 'sub-admin' ? SUB_ADMIN_DEFAULT_ROUTE : '/admin';
        return NextResponse.redirect(new URL(redirectPath, request.url));
      } catch {
        // Token invalid, let them see login page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
