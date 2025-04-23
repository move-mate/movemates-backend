import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';

// Helper functions to use in your API routes
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export function isAuthenticated(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return handler(req, session.user);
  };
}

export function hasRole(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  allowedRoles: string[]
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return handler(req, session.user);
  };
}

import { getServerSession } from 'next-auth';