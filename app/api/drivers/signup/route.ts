// app/api/drivers/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyToken } from "@/app/lib/jwt";
import { driverApplicationSchema } from './schema/driverApplicationSchema';

export async function POST(req: NextRequest) {
  try {
    // Get current authenticated user
      const authHeader = req.headers.get('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - Token missing' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (!decoded || decoded.role !== 'user') {
        return NextResponse.json({ error: 'Unauthorized - Users only' }, { status: 403 });
      }

      const userId = decoded.userId;

    
    // Check if user already has a driver profile
    const existingDriver = await db.driver.findUnique({
      where: { userId },
    });
    
    if (existingDriver) {
      return NextResponse.json(
        { error: 'You already have a driver profile' },
        { status: 409 }
      );
    }
    
    const body = await req.json();
    const validationResult = driverApplicationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const {
      licenseNumber,
      licenseExpiryDate,
      licenseIssuingCountry,
      licenseClass,
      yearsOfExperience,
      vehicle,
      bankAccount,
      serviceAreas,
      availabilitySchedule,
      languages,
      additionalServices,
    } = validationResult.data;
    
    // Create driver profile in a transaction
    const result = await db.$transaction(async (prisma) => {
      // Create driver record
      const driver = await prisma.driver.create({
        data: {
          userId,
          licenseNumber,
          licenseExpiryDate: new Date(licenseExpiryDate),
          licenseIssuingCountry,
          licenseClass,
          yearsOfExperience,
          isVerified: false, // Requires admin verification
          isAvailable: false, // Not available until verified
          backgroundCheckStatus: 'pending',
          availabilitySchedule: availabilitySchedule || {},
          languages: languages || [],
          additionalServices: additionalServices || [],
          // Create vehicle in the same transaction
          vehicle: {
            create: {
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              type: vehicle.type,
              color: vehicle.color,
              plateNumber: vehicle.plateNumber,
              insuranceProvider: vehicle.insuranceProvider,
              insurancePolicyNumber: vehicle.insurancePolicyNumber,
              insuranceExpiryDate: new Date(vehicle.insuranceExpiryDate),
              inspectionStatus: 'pending'
            },
          },
          // Create bank account in the same transaction
          bankAccount: {
            create: {
              accountHolderName: bankAccount.accountHolderName,
              accountNumber: bankAccount.accountNumber,
              bankName: bankAccount.bankName,
              branchCode: bankAccount.branchCode || null,
              routingNumber: bankAccount.routingNumber || null,
              accountType: bankAccount.accountType,
              isVerified: false
            },
          },
          // Create service areas in the same transaction
          serviceAreas: {
            create: serviceAreas.map(area => ({
              city: area.city,
              region: area.region || null,
              country: area.country
            }))
          }
        },
      });
      
      // Don't change the user role yet - wait for admin approval
      return { driver };
    });
    
    return NextResponse.json({
      message: 'Driver application submitted successfully',
      driverId: result.driver.id,
      status: 'pending_approval',
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting driver application:', error);
    return NextResponse.json(
      { error: 'Failed to submit driver application' },
      { status: 500 }
    );
  }
}