// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Skip authentication for the auth endpoints themselves
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // All other API routes require authentication
  if (pathname.startsWith('/api/') && !token) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
  }

  // Role-based access control
  if (token) {
    // Define route permissions
    const adminOnlyRoutes = [
      '/api/users',
      '/api/admin',
    ];

    const driverOnlyRoutes = [
      '/api/rides/accept',
      '/api/driver/location',
    ];

    const userOnlyRoutes = [
      '/api/rides/create',
    ];

    // Check admin routes
    if (adminOnlyRoutes.some(route => pathname.startsWith(route)) && token.role !== 'admin') {
      return NextResponse.json({ error: 'Access forbidden' }, { status: 403 });
    }

    // Check driver routes
    if (driverOnlyRoutes.some(route => pathname.startsWith(route)) && token.role !== 'driver') {
      return NextResponse.json({ error: 'Access forbidden' }, { status: 403 });
    }

    // Check user routes
    if (userOnlyRoutes.some(route => pathname.startsWith(route)) && token.role !== 'user') {
      return NextResponse.json({ error: 'Access forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: ['/api/:path*'],
};