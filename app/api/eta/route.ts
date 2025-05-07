// src/app/api/eta/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user

    // 2. Get search params
    const searchParams = request.nextUrl.searchParams;
    const pickupLat = searchParams.get('pickupLat');
    const pickupLng = searchParams.get('pickupLng');
    const dropoffLat = searchParams.get('dropoffLat');
    const dropoffLng = searchParams.get('dropoffLng');
    const furnitureSize = searchParams.get('furnitureSize');
    const furnitureWeight = searchParams.get('furnitureWeight');

    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return NextResponse.json(
        { error: 'All location coordinates are required' },
        { status: 400 }
      );
    }

    // 3. Calculate distance and ETA
    const distance = calculateDistance(
      parseFloat(pickupLat), 
      parseFloat(pickupLng),
      parseFloat(dropoffLat), 
      parseFloat(dropoffLng)
    );
    
    // Assuming average speed of 30 km/h
    const etaMinutes = Math.round(distance / 30 * 60);
    
    // 4. Calculate price based on distance and furniture size
    const basePrice = 15; // Base fare
    let pricePerKm = 2.0; // Default price per km
    
    // Adjust price based on furniture size
    if (furnitureSize === 'medium') {
      pricePerKm = 3.0;
    } else if (furnitureSize === 'large') {
      pricePerKm = 4.5;
    }
    
    // Add weight surcharge if needed
    const weightSurcharge = furnitureWeight && parseFloat(furnitureWeight) > 100 
      ? (parseFloat(furnitureWeight) - 100) * 0.1 
      : 0;
    
    const estimatedPrice = basePrice + (distance * pricePerKm) + weightSurcharge;

    return NextResponse.json({ 
      eta: {
        minutes: etaMinutes,
        distance: {
          kilometers: distance.toFixed(2),
          miles: (distance * 0.621371).toFixed(2)
        },
        estimatedPrice: estimatedPrice.toFixed(2)
      } 
    });
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ETA' },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}