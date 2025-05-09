// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { verifyToken } from "@/app/lib/jwt";


export async function GET(req: NextRequest) {
    try {
      const authHeader = req.headers.get('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - Token missing' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized - Admins only' }, { status: 403 });
      }
      
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      
      return NextResponse.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
}