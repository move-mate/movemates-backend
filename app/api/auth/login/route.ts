// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import * as bcrypt from "bcrypt";
import { issueTokenPair } from "@/app/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email }
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Get device info from user agent
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Generate token pair
    const tokens = await issueTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    }, userAgent);

    // User authenticated successfully
    return NextResponse.json({
        message: "Login successful.",
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}