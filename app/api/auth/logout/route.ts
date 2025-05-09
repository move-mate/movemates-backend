// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { blacklistToken, decodeJWT } from "@/app/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { token, allDevices = false } = await req.json();

    // Validation
    if (!token) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Decode token to get user ID
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.payload.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.payload.userId;

    // Blacklist the current access token
    const blacklisted = await blacklistToken(token, "User logout");
    if (!blacklisted) {
      return NextResponse.json(
        { error: "Failed to invalidate token" },
        { status: 500 }
      );
    }

    // Get device info from user agent for current device logout
    const userAgent = req.headers.get("user-agent") || "unknown";

    if (allDevices) {
      // Logout from all devices
      await db.refreshToken.deleteMany({
        where: { userId }
      });
    } else {
      // Logout only from current device
      await db.refreshToken.deleteMany({
        where: { 
          userId,
          deviceInfo: userAgent
        }
      });
    }

    return NextResponse.json({ 
      message: allDevices 
        ? "Successfully logged out from all devices" 
        : "Successfully logged out" 
    });

  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}