
// app/api/drivers/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Schema for driver signup validation
const driverSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string(),
  vehicleType: z.enum(['small', 'medium', 'large']),
  vehiclePlate: z.string().min(2, "Vehicle plate must be valid"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = driverSignupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { name, email, password, phone, vehicleType, vehiclePlate } = validationResult.data;
    
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
    
    // Create user and driver in a transaction
    const result = await db.$transaction(async (prisma) => {
      // Create user first
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone,
          role: 'driver', // Driver role
        },
      });
      
      // Then create driver profile
      const driver = await prisma.driver.create({
        data: {
          userId: user.id,
          vehicleType,
          vehiclePlate,
          isAvailable: true,
        },
      });
      
      return { user, driver };
    });
    
    return NextResponse.json({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      driverId: result.driver.id,
      vehicleType: result.driver.vehicleType,
      vehiclePlate: result.driver.vehiclePlate,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 }
    );
  }
}
