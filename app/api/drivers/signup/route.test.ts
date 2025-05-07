// app/api/drivers/signup/route.test.ts
import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';
import { db } from '@/app/lib/db';
import * as emailService from '@/app/lib/email-service';
import * as tokenUtils from '@/app/lib/token-utils';
import * as bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('@/app/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    driver: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/app/lib/email-service', () => ({
  sendVerificationEmail: jest.fn(),
}));

jest.mock('@/app/lib/token-utils', () => ({
  generateVerificationToken: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

// Suppress console.error during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Helper to create a mock NextRequest with JSON body
function createMockRequest(body: any): NextRequest {
  return new NextRequest('https://example.com', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/drivers/signup', () => {
  const validDriverData = {
    name: 'John Driver',
    email: 'john@example.com',
    password: 'Password123!',
    phone: '0123456789',
    vehicleType: 'medium',
    vehicleMake: 'Toyota',
    vehicleModel: 'Hilux',
    vehicleYear: 2020,
    vehicleColor: 'White',
    vehiclePlate: 'ABC123GP',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback(db);
    });
    
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (tokenUtils.createVerificationToken as jest.Mock).mockReturnValue('verification-token');
  });

  it('should return 400 if required fields are missing', async () => {
    // Arrange - missing email
    const incompleteData = { ...validDriverData };
    delete incompleteData.email;
    
    const req = createMockRequest(incompleteData);

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/required fields/i);
  });

  it('should return 400 if email is invalid', async () => {
    // Arrange
    const invalidData = { 
      ...validDriverData,
      email: 'not-an-email'
    };
    
    const req = createMockRequest(invalidData);

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/valid email/i);
  });

  it('should return 400 if password is too weak', async () => {
    // Arrange
    const weakPasswordData = { 
      ...validDriverData,
      password: 'weak'
    };
    
    const req = createMockRequest(weakPasswordData);

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/password/i);
  });

  it('should return 409 if email already exists', async () => {
    // Arrange
    const req = createMockRequest(validDriverData);
    
    // Mock user already exists
    (db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user' });

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(409);
    expect(data.error).toMatch(/already registered/i);
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: validDriverData.email }
    });
  });

  it('should return 409 if phone already exists', async () => {
    // Arrange
    const req = createMockRequest(validDriverData);
    
    // Mock email doesn't exist but phone does
    (db.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null) // First call for email check
      .mockResolvedValueOnce({ id: 'existing-user' }); // Second call for phone check

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(409);
    expect(data.error).toMatch(/phone number already registered/i);
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { phone: validDriverData.phone }
    });
  });

  it('should create a new driver successfully', async () => {
    // Arrange
    const req = createMockRequest(validDriverData);
    
    // Mock user doesn't exist
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    // Mock successful user creation
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      ...validDriverData,
      password: 'hashed-password',
    });
    
    // Mock successful driver creation
    (db.driver.create as jest.Mock).mockResolvedValue({
      id: 'new-driver-id',
      userId: 'new-user-id',
      vehicleType: validDriverData.vehicleType,
      isAvailable: true,
    });

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.message).toMatch(/success/i);
    
    // Verify password was hashed
    expect(bcrypt.hash).toHaveBeenCalledWith(validDriverData.password, expect.any(Number));
    
    // Verify transaction was used
    expect(db.$transaction).toHaveBeenCalled();
    
    // Verify user was created with correct data
    expect(db.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: validDriverData.email,
        name: validDriverData.name,
        phone: validDriverData.phone,
        password: 'hashed-password',
        role: 'driver',
      })
    });
    
    // Verify driver was created with correct data
    expect(db.driver.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'new-user-id',
        vehicleType: validDriverData.vehicleType,
        vehicleMake: validDriverData.vehicleMake,
        vehicleModel: validDriverData.vehicleModel,
      })
    });
    
    // Verify verification email was sent
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      validDriverData.email,
      validDriverData.name,
      'verification-token'
    );
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    const req = createMockRequest(validDriverData);
    
    // Mock user doesn't exist
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    // Mock database error during transaction
    (db.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toMatch(/failed to register/i);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle email sending errors gracefully', async () => {
    // Arrange
    const req = createMockRequest(validDriverData);
    
    // Mock user doesn't exist
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    // Mock successful database operations
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      ...validDriverData,
      password: 'hashed-password',
    });
    
    (db.driver.create as jest.Mock).mockResolvedValue({
      id: 'new-driver-id',
      userId: 'new-user-id',
    });
    
    // Mock email sending error
    (emailService.sendVerificationEmail as jest.Mock).mockRejectedValue(new Error('Email error'));

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201); // Should still succeed even if email fails
    expect(data.message).toMatch(/success/i);
    expect(data.warning).toMatch(/failed to send verification email/i);
    expect(console.error).toHaveBeenCalled();
  });
});