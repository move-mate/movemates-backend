// app/lib/jwt.ts
import jwt from 'jsonwebtoken';
import { db } from '@/app/lib/db';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'my-key';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface JWTDecoded {
  payload: TokenPayload;
  jti: string;
  iat: number;
  exp: number;
}


// Generate 
export function generateToken(payload: TokenPayload): string {
  const jti = uuidv4();
  return jwt.sign({ payload, jti }, JWT_SECRET, { expiresIn: '15m' });
}

// Generate a refresh token
export async function generateRefreshToken(userId: string, deviceInfo?: string): Promise<string> {
  // Create a secure random token
  const token = uuidv4();
  
  // Store in database with 7 day expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1);
  
  await db.refreshToken.create({
    data: {
      token,
      userId,
      deviceInfo,
      expiresAt,
    },
  });
  
  return token;
}


// Decode jwt
export function decodeJWT(token: string): JWTDecoded | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded;
  } catch (err) {
    console.error('Invalid JWT:', err);
    return null;
  }
}

// Verify and use a refresh token to generate new tokens
export async function refreshToken(refreshToken: string, deviceInfo?: string): Promise<TokenResponse | null> {
  try {
    // Find the refresh token in the database
    const storedToken = await db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    
    // Check if token exists and is not expired
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return null;
    }
    
    // Get user information
    const { user } = storedToken;
    
    // Delete the used refresh token (one-time use)
    await db.refreshToken.delete({
      where: { id: storedToken.id },
    });
    
    // Create new token pair
    return issueTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    }, deviceInfo);
    
  } catch (error) {
    console.error('Error using refresh token:', error);
    return null;
  }
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const jti = decoded.jti;
    if (!jti || await isTokenBlacklisted(jti)) return null;

    return decoded.payload as TokenPayload;
  } catch {
    return null;
  }
}

// Blacklist a token (for logout or security breach)
export async function blacklistToken(token: string, reason?: string): Promise<boolean> {
  try {
    // Decode token to get expiration and JWT ID
    const decoded = decodeJWT(token);
    
    if (!decoded || !decoded.jti || !decoded.exp) {
      return false;
    }
    
    // Add to blacklist
    await db.tokenBlacklist.create({
      data: {
        jti: decoded.jti,
        reason: reason || 'User logout',
        expiresAt: new Date(decoded.exp * 1000), // Convert UNIX timestamp to Date
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error blacklisting token:', error);
    return false;
  }
}

// Check if a token is blacklisted
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const blacklistedToken = await db.tokenBlacklist.findUnique({
      where: { jti },
    });
    
    return !!blacklistedToken;
  } catch (error) {
    console.error('Error checking blacklisted token:', error);
    return false;
  }
}

// Invalidate all tokens for a user (force logout from all devices)
export async function invalidateAllUserTokens(userId: string): Promise<boolean> {
  try {
    // Update user's token version to invalidate all current JWTs
    await db.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    
    // Delete all refresh tokens for this user
    await db.refreshToken.deleteMany({
      where: { userId },
    });
    
    return true;
  } catch (error) {
    console.error('Error invalidating user tokens:', error);
    return false;
  }
}

// Cleanup expired blacklisted tokens (run periodically)
export async function cleanupBlacklist(): Promise<number> {
  try {
    const now = new Date();
    
    // Delete expired blacklisted tokens
    const result = await db.tokenBlacklist.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });
    
    // Also cleanup expired refresh tokens
    await db.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });
    
    return result.count;
  } catch (error) {
    console.error('Error cleaning up blacklist:', error);
    return 0;
  }
}


// Issue both access and refresh tokens
export async function issueTokenPair(payload: TokenPayload, deviceInfo?: string): Promise<TokenResponse> {
  const accessToken = generateToken(payload);
  const refreshToken = await generateRefreshToken(payload.userId, deviceInfo);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}