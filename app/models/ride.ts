// models/ride.ts
export type RideStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  dropoffLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  status: RideStatus;
  estimatedDistance: number; // in km
  estimatedPrice: number;
  furnitureDetails: {
    size: 'small' | 'medium' | 'large';
    weight: number; // in kg
    description: string;
  };
  scheduledTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}