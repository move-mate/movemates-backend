// app/api/rides/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from "@/app/lib/jwt";
import { db } from '@/app/lib/db';

// Create a new ride request
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Token missing' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized - User only can create a route' }, { status: 403 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    
    // 3. Create new ride in database
    const ride = await db.ride.create({
      data: {
        userId: body.userId,
        pickupAddress: body.pickupAddress,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        dropoffAddress: body.dropoffAddress,
        dropoffLat: body.dropoffLat,
        dropoffLng: body.dropoffLng,
        furnitureSize: body.furnitureSize,
        furnitureWeight: body.furnitureWeight,
        furnitureDetails: body.furnitureDetails,
        scheduledTime: body.scheduledTime,
        estimatedDistance: body.estimatedDistance,
        estimatedPrice: body.estimatedPrice,
        status: 'requested'
      }
    });
    
    // 4. Return the created ride
    return NextResponse.json(
      { message: 'Ride request created successfully', ride },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating ride request:', error);
    return NextResponse.json(
      { error: 'Failed to create ride request' },
      { status: 500 }
    );
  }
}

// Get all ride requests for authenticated user
export async function GET(request: NextRequest) {
    try {
      // 1. Authenticate user
      const authHeader = request.headers.get('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - Token missing' }, { status: 401 });
      }
      
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);
  

      if (!decoded || !['admin', 'driver', 'user'].includes(decoded.role)) {
        return NextResponse.json({ error: 'Unauthorized - Admins, Drivers and users only' }, { status: 403 });
      }
      
      // 3. Fetch ride requests for this user
      const rides = await db.ride.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          driver: true,
          // payment: true
        }
      });
      
      return NextResponse.json({ rides });
    } catch (error) {
      console.error('Error fetching ride requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ride requests' },
        { status: 500 }
      );
    }
  }