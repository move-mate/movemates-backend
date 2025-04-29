// app/api/users/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Schema for user signup validation
const userSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = userSignupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { name, email, password, phone } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: 'user',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}