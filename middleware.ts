import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { decodeJWT } from '@/app/lib/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // PUBLIC ROUTES that shouldn't require authentication
  const publicRoutes = [
    '/api/users/signup',
    '/api/drivers/signup',
    '/api/login',
    '/api/email/send',
    '/api/email/verify'
  ];

  // Check if the current route is a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get the token from the Authorization header
  const authHeader = req.headers.get('Authorization');
  
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
    
  // If no token is provided for protected routes
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized - Token required' }, { status: 401 });
  }
  
  try {
    const decodedToken = decodeJWT(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
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

    if (requiredRoles && !requiredRoles.includes(decodedToken.role)) {
      return NextResponse.json({ 
        error: 'Forbidden - Insufficient permissions',
        requiredRoles,
        yourRole: decodedToken.role
      }, { status: 403 });
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Server error during authentication' }, { status: 500 });
  }
}

export const config = {
  matcher: [
    '/api/rides/:path*', 
    '/api/users/:path*', 
    '/api/drivers/:path*'
  ],
};