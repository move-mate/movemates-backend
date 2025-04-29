import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { createVerificationToken } from '@/app/lib/token-utils';
import { sendVerificationEmail } from '@/app/lib/email-service';

// This endpoint generates and sends a verification token
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a verification token
    const token = await createVerificationToken(email);

    // Create verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify?token=${token}&email=${encodeURIComponent(email)}`;
    
    console.log('Verification link:', verificationLink);
    
    // Send verification email
    await sendVerificationEmail(email, verificationLink);

    return NextResponse.json({
      message: 'Verification email sent',
      // Don't include this in production:
      debug: { token, verificationLink }
    });
  } catch (error) {
    console.error('Error sending verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}