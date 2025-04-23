import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // PUBLIC ROUTES that shouldn't require authentication
  const publicRoutes = [
    '/api/users/signup',
    '/api/drivers/signup'
  ];

  // Check if the current route is a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Define protected routes and required roles
  const protectedRoutes = {
    '/api/rides/create': ['user'],
    '/api/rides/accept': ['driver'],
    '/api/users': ['admin'],
    '/api/drivers': ['admin'],
  };

  // Check if the route is protected
  const requiredRoles = Object.entries(protectedRoutes).find(([route]) => 
    pathname.startsWith(route)
  )?.[1];

  if (requiredRoles) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!requiredRoles.includes(token.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/rides/:path*', '/api/users/:path*', '/api/drivers/:path*'],
};