// app/api/drivers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/jwt";
import { db } from "@/app/lib/db";

export async function GET(req: NextRequest) {
    try {
      const authHeader = req.headers.get('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - Token missing' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized - Admins only' }, { status: 403 });
      }
      
      const drivers = await db.driver.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      
      return NextResponse.json(drivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch drivers' },
        { status: 500 }
      );
    }
  }