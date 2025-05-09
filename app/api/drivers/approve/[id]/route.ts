// app/api/admin/drivers/approve/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyToken } from "@/app/lib/jwt";
import { approvalSchema } from './schema/approvalSchema';

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const driverId = url.pathname.split('/').pop();

    // Get current authenticated user
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized - Token missing' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized - Admins only' }, { status: 403 });
    }
    
    // Check if driver exists
    const driver = await db.driver.findUnique({
      where: { id: driverId },
      include: { user: true, vehicle: true }
    });
    
    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    const validationResult = approvalSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { approved, rejectionReason, backgroundCheckStatus, inspectionStatus } = validationResult.data;
    
    // Process the approval or rejection
    if (approved) {
      // Update in a transaction
      await db.$transaction(async (prisma) => {
        // Update driver status
        await prisma.driver.update({
          where: { id: driverId },
          data: {
            isVerified: true,
            isAvailable: true,
            backgroundCheckStatus: backgroundCheckStatus || 'approved',
          },
        });
        
        // Update vehicle inspection status if provided
        if (inspectionStatus) {
          await prisma.vehicle.update({
            where: { driverId },
            data: {
              inspectionStatus,
            },
          });
        }
        
        // Update user role to driver
        await prisma.user.update({
          where: { id: driver.userId },
          data: {
            role: 'driver',
          },
        });
      });
      
      // Send notification or email to driver about approval
      // This would be implemented with your notification system
      
      return NextResponse.json({
        message: 'Driver application approved successfully',
        driver: {
          id: driver.id,
          userId: driver.userId,
          name: driver.user.name,
          isVerified: true,
        },
      });
    } else {
      // Reject the application
      await db.$transaction(async (prisma) => {
        // Update driver status
        await prisma.driver.update({
          where: { id: driverId },
          data: {
            isVerified: false,
            backgroundCheckStatus: backgroundCheckStatus || 'rejected',
            // Store rejection reason in a notes field if you have one
          },
        });
        
        // Update vehicle inspection status if provided
        if (inspectionStatus) {
          await prisma.vehicle.update({
            where: { driverId },
            data: {
              inspectionStatus,
            },
          });
        }
      });
      
      // Send notification or email to driver about rejection
      // This would be implemented with your notification system
      
      return NextResponse.json({
        message: 'Driver application rejected',
        reason: rejectionReason || 'Application did not meet requirements',
      });
    }
  } catch (error) {
    console.error('Error processing driver approval:', error);
    return NextResponse.json(
      { error: 'Failed to process driver approval' },
      { status: 500 }
    );
  }
}