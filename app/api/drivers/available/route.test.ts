// // app/api/drivers/available/route.test.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { GET } from './route';
// import { db } from '@/app/lib/db';
// import * as jwt from '@/app/lib/jwt';

// // Mock dependencies
// jest.mock('@/app/lib/db', () => ({
//   db: {
//     driver: {
//       findMany: jest.fn(),
//     },
//   },
// }));

// jest.mock('@/app/lib/jwt', () => ({
//   verifyToken: jest.fn(),
// }));

// // Helper to create a mock NextRequest
// function createMockRequest({
//   headers = {},
//   searchParams = {},
// }: {
//   headers?: Record<string, string>;
//   searchParams?: Record<string, string>;
// }): NextRequest {
//   const url = new URL('https://example.com');
  
//   // Add search params
//   Object.entries(searchParams).forEach(([key, value]) => {
//     url.searchParams.append(key, value);
//   });

//   return new NextRequest(url, {
//     headers: new Headers(headers),
//   });
// }

// describe('GET /api/drivers/available', () => {
//   const mockDrivers = [
//     {
//       id: '1',
//       isAvailable: true,
//       currentLat: -26.2041,
//       currentLng: 28.0473,
//       vehicleType: 'large',
//       user: {
//         name: 'John Driver',
//         phone: '0123456789',
//         image: '/john.jpg',
//       }
//     }
//   ];

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should return 401 if token is missing', async () => {
//     // Arrange
//     const req = createMockRequest({
//       searchParams: {
//         latitude: '-26.2',
//         longitude: '28.0',
//       }
//     });

//     // Act
//     const response = await GET(req);
//     const data = await response.json();

//     // Assert
//     expect(response.status).toBe(401);
//     expect(data.error).toMatch(/Token missing/);
//   });

//   it('should return 403 if user is not admin', async () => {
//     // Arrange
//     const req = createMockRequest({
//       headers: { Authorization: 'Bearer fake-token' },
//       searchParams: {
//         latitude: '-26.2',
//         longitude: '28.0',
//       }
//     });

//     // Mock token validation to return non-admin user
//     (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'user' });

//     // Act
//     const response = await GET(req);
//     const data = await response.json();

//     // Assert
//     expect(response.status).toBe(403);
//     expect(data.error).toMatch(/Admins only/);
//   });

//   it('should return 400 if coordinates are missing', async () => {
//     // Arrange
//     const req = createMockRequest({
//       headers: { Authorization: 'Bearer fake-token' },
//       // No latitude/longitude params
//     });

//     // Mock token validation to return admin user
//     (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });

//     // Act
//     const response = await GET(req);
//     const data = await response.json();

//     // Assert
//     expect(response.status).toBe(400);
//     expect(data.error).toMatch(/Latitude and longitude are required/);
//   });

//   it('should return list of nearby drivers', async () => {
//     // Arrange
//     const req = createMockRequest({
//       headers: { Authorization: 'Bearer fake-token' },
//       searchParams: {
//         latitude: '-26.2',
//         longitude: '28.0',
//         furnitureSize: 'large'
//       }
//     });

//     // Mock token validation to return admin user
//     (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });
    
//     // Mock database response
//     (db.driver.findMany as jest.Mock).mockResolvedValue(mockDrivers);

//     // Act
//     const response = await GET(req);
//     const data = await response.json();

//     // Assert
//     expect(response.status).toBe(200);
//     expect(data.drivers.length).toBe(1);
//     expect(data.drivers[0].user.name).toBe('John Driver');
//     expect(data.drivers[0]).toHaveProperty('distance');
//     expect(data.drivers[0]).toHaveProperty('estimatedArrival');

//     // Check that the correct query was made to the database
//     expect(db.driver.findMany).toHaveBeenCalledWith(
//       expect.objectContaining({
//         where: expect.objectContaining({
//           isAvailable: true,
//           vehicleType: {
//             in: ['large'] // Should only include 'large' vehicles for large furniture
//           }
//         })
//       })
//     );
//   });

//   it('should handle errors gracefully', async () => {
//     // Arrange
//     const req = createMockRequest({
//       headers: { Authorization: 'Bearer fake-token' },
//       searchParams: {
//         latitude: '-26.2',
//         longitude: '28.0',
//       }
//     });

//     // Mock token validation to return admin user
//     (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });
    
//     // Mock database error
//     (db.driver.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

//     // Act
//     const response = await GET(req);
//     const data = await response.json();

//     // Assert
//     expect(response.status).toBe(500);
//     expect(data.error).toBe('Failed to fetch available drivers');
//   });
// });

// // Mock calculateDistance since it's used internally but not exported
// // This is added to the global scope to be used by the imported module
// global.calculateDistance = jest.fn((lat1, lng1, lat2, lng2) => {
//   // Simple mock implementation that returns a distance in km
//   return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 111;
// });








// app/api/drivers/available/route.test.ts
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { db } from '@/app/lib/db';
import * as jwt from '@/app/lib/jwt';

// Mock dependencies
jest.mock('@/app/lib/db', () => ({
  db: {
    driver: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/app/lib/jwt', () => ({
  verifyToken: jest.fn(),
}));

// Suppress console.error during tests to avoid cluttering test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Helper to create a mock NextRequest
function createMockRequest({
  headers = {},
  searchParams = {},
}: {
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}): NextRequest {
  const url = new URL('https://example.com');
  
  // Add search params
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return new NextRequest(url, {
    headers: new Headers(headers),
  });
}

describe('GET /api/drivers/available', () => {
  const mockDrivers = [
    {
      id: '1',
      isAvailable: true,
      currentLat: -26.2041,
      currentLng: 28.0473,
      vehicleType: 'large',
      user: {
        name: 'John Driver',
        phone: '0123456789',
        image: '/john.jpg',
      }
    },
    {
      id: '2',
      isAvailable: true,
      currentLat: -26.3041, // Further away
      currentLng: 28.1473,  // Further away
      vehicleType: 'medium',
      user: {
        name: 'Jane Driver',
        phone: '0123456780',
        image: '/jane.jpg',
      }
    },
    {
      id: '3',
      isAvailable: true,
      // Missing lat/lng coordinates
      vehicleType: 'small',
      user: {
        name: 'Missing Coordinates',
        phone: '0123456781',
        image: '/missing.jpg',
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authorization header is missing', async () => {
    // Arrange
    const req = createMockRequest({
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
      }
    });

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data.error).toMatch(/Token missing/);
  });

  it('should return 401 if authorization header has incorrect format', async () => {
    // Arrange
    const req = createMockRequest({
      headers: { Authorization: 'InvalidFormat' }, // Missing 'Bearer '
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
      }
    });

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data.error).toMatch(/Token missing/);
  });

  it('should return 403 if user is not admin', async () => {
    // Arrange
    const req = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
      }
    });

    // Mock token validation to return non-admin user
    (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'user' });

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(data.error).toMatch(/Admins only/);
  });

  it('should return 403 if decoded token is null', async () => {
    // Arrange
    const req = createMockRequest({
      headers: { Authorization: 'Bearer invalid-token' },
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
      }
    });

    // Mock token validation to return null (invalid token)
    (jwt.verifyToken as jest.Mock).mockReturnValue(null);

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(data.error).toMatch(/Unauthorized/);
  });

  it('should return 400 if latitude is missing', async () => {
    // Arrange
    const req = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        // Missing latitude
        longitude: '28.0',
      }
    });

    // Mock token validation to return admin user
    (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Latitude and longitude are required/);
  });

  it('should return 400 if longitude is missing', async () => {
    // Arrange
    const req = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        latitude: '-26.2',
        // Missing longitude
      }
    });

    // Mock token validation to return admin user
    (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Latitude and longitude are required/);
  });

  it('should return list of nearby drivers sorted by distance', async () => {
    // Arrange
    const req = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
      }
    });

    // Mock token validation to return admin user
    (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });
    
    // Mock database response
    (db.driver.findMany as jest.Mock).mockResolvedValue(mockDrivers);

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    
    // Should only include drivers with valid coordinates
    expect(data.drivers.length).toBe(2);
    
    // Should be sorted by distance (closest first)
    expect(data.drivers[0].id).toBe('1');
    expect(data.drivers[1].id).toBe('2');
    
    // Should have calculated properties
    expect(data.drivers[0]).toHaveProperty('distance');
    expect(data.drivers[0]).toHaveProperty('estimatedArrival');
    
    // Database query should not include furniture size filter
    expect(db.driver.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isAvailable: true
        }
      })
    );
  });

  it('should filter drivers by furniture size', async () => {
    // Arrange - Testing small furniture size
    const reqSmall = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
        furnitureSize: 'small'
      }
    });

    // Mock token validation to return admin user
    (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });
    
    // Mock database response
    (db.driver.findMany as jest.Mock).mockResolvedValue(mockDrivers);

    // Act
    await GET(reqSmall);

    // Assert - All vehicle types should be included for small furniture
    expect(db.driver.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vehicleType: {
            in: ['small', 'medium', 'large']
          }
        })
      })
    );

    // Arrange - Testing medium furniture size
    const reqMedium = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
        furnitureSize: 'medium'
      }
    });

    // Act
    await GET(reqMedium);

    // Assert - Only medium and large vehicles should be included
    expect(db.driver.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vehicleType: {
            in: ['medium', 'large']
          }
        })
      })
    );

    // Arrange - Testing large furniture size
    const reqLarge = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
        furnitureSize: 'large'
      }
    });

    // Act
    await GET(reqLarge);

    // Assert - Only large vehicles should be included
    expect(db.driver.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vehicleType: {
            in: ['large']
          }
        })
      })
    );
  });

  it('should handle invalid furniture size', async () => {
    // Arrange
    const req = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
        furnitureSize: 'invalid-size' // Non-existing furniture size
      }
    });

    // Mock token validation to return admin user
    (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });
    
    // Mock database response
    (db.driver.findMany as jest.Mock).mockResolvedValue(mockDrivers);

    // Act
    await GET(req);

    // Assert - All vehicle types should be included for invalid size
    expect(db.driver.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vehicleType: {
            in: ['small', 'medium', 'large']
          }
        })
      })
    );
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const req = createMockRequest({
      headers: { Authorization: 'Bearer fake-token' },
      searchParams: {
        latitude: '-26.2',
        longitude: '28.0',
      }
    });

    // Mock token validation to return admin user
    (jwt.verifyToken as jest.Mock).mockReturnValue({ role: 'admin' });
    
    // Mock database error
    (db.driver.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch available drivers');
    
    // Verify the error was logged
    expect(console.error).toHaveBeenCalled();
  });
});

// Mock calculateDistance since it's used internally but not exported
// This is added to the global scope to be used by the imported module
global.calculateDistance = jest.fn((lat1, lng1, lat2, lng2) => {
  // Simple mock implement  ation that returns a distance in km
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 111;
});