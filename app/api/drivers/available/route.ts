// app/api/drivers/available/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Token missing' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admins only' }, { status: 403 });
    }

    // 2. Get search params
    const searchParams = request.nextUrl.searchParams;
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const furnitureSize = searchParams.get('furnitureSize');

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // 3. Find available drivers near the location
    // Note: This is a simplified example - in a real app, you'd use 
    // more sophisticated geospatial queries
    const availableDrivers = await db.driver.findMany({
      where: {
        isAvailable: true,
        ...(furnitureSize ? { vehicleType: {
          // Match the vehicle type to furniture size
          in: getVehicleTypesForFurniture(furnitureSize)
        }} : {})
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            image: true
          }
        }
      }
    });

    // 4. Calculate distance and sort by proximity
    // const driversWithDistance = availableDrivers
    //   .filter(driver => driver.currentLat && driver.currentLng)
    //   .map(driver => {
    //     const distance = calculateDistance(
    //       parseFloat(latitude),
    //       parseFloat(longitude),
    //       driver.currentLat!,
    //       driver.currentLng!
    //     );
        
    //     return {
    //       ...driver,
    //       distance,
    //       estimatedArrival: Math.round(distance / 30 * 60) // Estimated arrival in minutes
    //     };
    //   })
    //   .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ });
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available drivers' },
      { status: 500 }
    );
  }
}

// Helper function to determine which vehicle types can handle a furniture size
function getVehicleTypesForFurniture(furnitureSize: string): string[] {
  switch (furnitureSize) {
    case 'small':
      return ['small', 'medium', 'large'];
    case 'medium':
      return ['medium', 'large'];
    case 'large':
      return ['large'];
    default:
      return ['small', 'medium', 'large'];
  }
}