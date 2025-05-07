// src/app/api/rides/[id]/select-driver/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user

    // 2. Parse request body
    const body = await request.json();
    
    if (!body.driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // 3. Check if ride exists and belongs to user
    const ride = await db.ride.findUnique({
      where: { id: params.id }
    });

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }


    // 4. Check if driver exists and is available
    const driver = await db.driver.findUnique({
      where: { id: body.driverId }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    if (!driver.isAvailable) {
      return NextResponse.json(
        { error: 'Driver is no longer available' },
        { status: 400 }
      );
    }

    // 5. Update the ride with the selected driver
    const updatedRide = await db.ride.update({
      where: { id: params.id },
      data: {
        driverId: body.driverId,
        status: 'accepted',
      }
    });

    // 6. Update driver availability
    await db.driver.update({
      where: { id: body.driverId },
      data: { isAvailable: false }
    });

    return NextResponse.json({ 
      message: 'Driver selected successfully',
      ride: updatedRide
    });
  } catch (error) {
    console.error('Error selecting driver:', error);
    return NextResponse.json(
      { error: 'Failed to select driver' },
      { status: 500 }
    );
  }
}