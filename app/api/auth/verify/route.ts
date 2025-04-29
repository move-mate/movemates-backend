import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyToken } from '@/app/lib/token-utils';

// This endpoint verifies a token and marks a user as verified
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = await verifyToken(email, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Update the user as verified
    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    });

    // Redirect to a success page or return a success response
    // Option 1: Return JSON response
    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
    
    // Option 2: Redirect to a success page
    // return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/verification-success`);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}