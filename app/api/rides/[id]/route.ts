// src/app/api/rides/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

// Get a specific ride
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
        

    // 2. Fetch the specific ride
    const ride = await db.ride.findUnique({
      where: {
        id: params.id,
      },
      include: {
        driver: true,
        // payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true
          }
        }
      }
    });

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }

    // 3. Check if user is authorized to view this ride
    const isAdmin = session.user.role === 'admin';
    const isDriver = session.user.id === ride.driver?.userId;
    const isCustomer = session.user.id === ride.userId;

    if (!isAdmin && !isDriver && !isCustomer) {
      return NextResponse.json(
        { error: 'Unauthorized to view this ride' },
        { status: 403 }
      );
    }

    return NextResponse.json({ ride });
  } catch (error) {
    console.error('Error fetching ride:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ride' },
      { status: 500 }
    );
  }
}

// Update a ride
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();

    // 3. Find ride to update
    const ride = await db.ride.findUnique({
      where: { id: params.id },
      include: { driver: true }
    });

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }

    // 4. Check if user is authorized to update this ride
    const isAdmin = session.user.role === 'admin';
    const isDriver = session.user.id === ride.driver?.userId;
    const isCustomer = session.user.id === ride.userId;

    if (!isAdmin && !isDriver && !isCustomer) {
      return NextResponse.json(
        { error: 'Unauthorized to update this ride' },
        { status: 403 }
      );
    }

    // 5. Update the ride
    const updatedRide = await db.ride.update({
      where: { id: params.id },
      data: {
        ...body,
        // If updating status to 'completed', set the completion time
        ...(body.status === 'completed' ? { 
          // Additional fields to update when completing a ride
        } : {})
      }
    });

    return NextResponse.json({ 
      message: 'Ride updated successfully',
      ride: updatedRide
    });
  } catch (error) {
    console.error('Error updating ride:', error);
    return NextResponse.json(
      { error: 'Failed to update ride' },
      { status: 500 }
    );
  }
}

// Cancel a ride
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Find ride to cancel
    const ride = await db.ride.findUnique({
      where: { id: params.id }
    });

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }

    // 3. Check if user is authorized to cancel this ride
    const isAdmin = session.user.role === 'admin';
    const isCustomer = session.user.id === ride.userId;

    if (!isAdmin && !isCustomer) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this ride' },
        { status: 403 }
      );
    }

    // 4. Check if ride can be cancelled (not already completed or in progress)
    if (ride.status === 'completed' || ride.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Cannot cancel a ride that is already in progress or completed' },
        { status: 400 }
      );
    }

    // 5. Cancel the ride
    const cancelledRide = await db.ride.update({
      where: { id: params.id },
      data: {
        status: 'cancelled'
      }
    });

    return NextResponse.json({ 
      message: 'Ride cancelled successfully',
      ride: cancelledRide
    });
  } catch (error) {
    console.error('Error cancelling ride:', error);
    return NextResponse.json(
      { error: 'Failed to cancel ride' },
      { status: 500 }
    );
  }
}
