import { randomBytes } from 'crypto';
import { db } from '@/app/lib/db';

// Generate a random token
export function generateToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

// Create a verification token and save it to the database
export async function createVerificationToken(
  identifier: string, 
  expiresInHours = 24
): Promise<string> {
  // Delete any existing tokens for this identifier
  await db.verificationToken.deleteMany({
    where: { identifier },
  });

  // Generate expiration date
  const expires = new Date();
  expires.setHours(expires.getHours() + expiresInHours);

  // Create a new token
  const token = generateToken();
  
  // Save token to database
  await db.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return token;
}

// Verify a token
export async function verifyToken(identifier: string, token: string): Promise<boolean> {
  const storedToken = await db.verificationToken.findFirst({
    where: {
      identifier,
      token,
      expires: {
        gt: new Date(),
      },
    },
  });

  if (!storedToken) {
    return false;
  }

  // Delete the token after use
  await db.verificationToken.delete({
    where: { 
      identifier_token: {
        identifier: storedToken.identifier,
        token: storedToken.token
      }
    },
  });

  return true;
}