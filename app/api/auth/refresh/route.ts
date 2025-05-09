// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { refreshToken } from "@/app/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from request body for stateless API
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Get device info from user agent
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Use refresh token to get new token pair
    const tokens = await refreshToken(refreshToken, userAgent);

    if (!tokens) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Return both tokens in the response for stateless API
    return NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 }
    );
  }
}