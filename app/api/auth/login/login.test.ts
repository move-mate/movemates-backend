// app/api/auth/login/login.test.ts

import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { db } from "@/app/lib/db";
import * as bcrypt from "bcrypt";
import { issueTokenPair } from "@/app/lib/jwt";

// Mock dependencies
jest.mock("@/app/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn()
}));

jest.mock("@/app/lib/jwt", () => ({
  issueTokenPair: jest.fn()
}));

describe("Login API Route", () => {
  // Helper to create mock requests
  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn((header) => headers[header] || null)
      }
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 if email is missing", async () => {
    const req = createMockRequest({ password: "password123" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email and password are required");
  });

  test("should return 400 if password is missing", async () => {
    const req = createMockRequest({ email: "user@example.com" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email and password are required");
  });

  test("should return 401 if user is not found", async () => {
    const req = createMockRequest({ 
      email: "nonexistent@example.com",
      password: "password123"
    });

    // Mock db to return null (user not found)
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(req);
    const data = await response.json();

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "nonexistent@example.com" }
    });
    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid credentials");
  });

  test("should return 401 if password is incorrect", async () => {
    const req = createMockRequest({ 
      email: "user@example.com",
      password: "wrongpassword"
    });

    // Mock user found
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-id-1",
      email: "user@example.com",
      passwordHash: "hashed_password",
      role: "USER"
    });

    // Mock password comparison to fail
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const response = await POST(req);
    const data = await response.json();

    expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", "hashed_password");
    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid credentials");
  });

  test("should return tokens and success message on successful login", async () => {
    const mockUser = {
      id: "user-id-1",
      email: "user@example.com",
      passwordHash: "hashed_password",
      role: "USER"
    };

    const req = createMockRequest(
      { 
        email: "user@example.com",
        password: "correct_password"
      },
      { "user-agent": "Jest Test" }
    );

    // Mock successful user lookup
    (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    // Mock successful password verification
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Mock token generation
    const mockTokens = {
      accessToken: "mock-jwt-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600
    };
    (issueTokenPair as jest.Mock).mockResolvedValue(mockTokens);

    const response = await POST(req);
    const data = await response.json();

    // Check that tokens were generated with correct parameters
    expect(issueTokenPair).toHaveBeenCalledWith(
      {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      },
      "Jest Test"
    );

    // Check response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      message: "Login successful.",
      token: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
      expiresIn: mockTokens.expiresIn,
    });
  });

  test("should return 500 when an unexpected error occurs", async () => {
    const req = createMockRequest({ 
      email: "user@example.com",
      password: "password123"
    });

    // Mock a database error
    (db.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database connection error"));
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await POST(req);
    const data = await response.json();

    expect(consoleSpy).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(data.error).toBe("Authentication failed");

    consoleSpy.mockRestore();
  });
});