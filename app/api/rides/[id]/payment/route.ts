// src/app/api/rides/[id]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    

    // 2. Parse request body
    const body = await request.json();
    
    if (!body.method || !body.amount) {
      return NextResponse.json(
        { error: 'Payment method and amount are required' },
        { status: 400 }
      );
    }

    // 3. Find the ride
    const ride = await db.ride.findUnique({
      where: { id: context.params.id }
    });

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }


    // 4. Process payment
    // This would integrate with a payment processor like Stripe
    // const paymentResult = await processPayment(body);

    // 5. Create payment record
    const payment = await db.payment.create({
      data: {
        userId: body.user.id,
        rideId: context.params.id,
        method: body.method,
        amount: body.amount,
        currency: body.currency || 'USD',
        status: 'completed',
        cardLastFour: body.cardLastFour
      }
    });

    // 6. Update the ride with payment info
    const updatedRide = await db.ride.update({
      where: { id: context.params.id },
      data: {
        // paymentId: payment.id
      }
    });

    return NextResponse.json({ 
      message: 'Payment processed successfully',
      payment,
      ride: updatedRide
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}