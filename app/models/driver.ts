// models/driver.ts
export interface Driver {
    id: string;
    userId: string;
    vehicleType: 'small' | 'medium' | 'large';
    vehiclePlate: string;
    isAvailable: boolean;
    currentLocation?: {
      lat: number;
      lng: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  