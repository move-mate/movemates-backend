// __tests__/api/auth/logout.test.ts
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/logout/route";
import { db } from "@/app/lib/db";
import { blacklistToken, decodeJWT } from "@/app/lib/jwt";

// Mock dependencies
jest.mock("@/app/lib/db", () => ({
  db: {
    refreshToken: {
      deleteMany: jest.fn()
    }
  }
}));

jest.mock("@/app/lib/jwt", () => ({
  blacklistToken: jest.fn(),
  decodeJWT: jest.fn()
}));

describe("Logout API Route", () => {
  // Helper to create mock requests
  const createMockRequest = (body: any, headers = {}) => {
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

  test("should return 400 if token is missing", async () => {
    const req = createMockRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Access token is required");
  });

  test("should return 401 if token is invalid", async () => {
    const req = createMockRequest({ token: "invalid-token" });

    // Mock decodeJWT to return null for invalid token
    (decodeJWT as jest.Mock).mockReturnValue(null);

    const response = await POST(req);
    const data = await response.json();

    expect(decodeJWT).toHaveBeenCalledWith("invalid-token");
    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid token");
  });

  test("should return 401 if token payload doesn't contain userId", async () => {
    const req = createMockRequest({ token: "token-without-userId" });

    // Mock decodeJWT to return a payload without userId
    (decodeJWT as jest.Mock).mockReturnValue({
      payload: { email: "user@example.com" } // No userId
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid token");
  });

  test("should return 500 if blacklisting token fails", async () => {
    const req = createMockRequest({ token: "valid-token" });

    // Mock valid token decode
    (decodeJWT as jest.Mock).mockReturnValue({
      payload: { userId: "user-123" }
    });

    // Mock blacklistToken to fail
    (blacklistToken as jest.Mock).mockResolvedValue(false);

    const response = await POST(req);
    const data = await response.json();

    expect(blacklistToken).toHaveBeenCalledWith("valid-token", "User logout");
    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to invalidate token");
  });

  test("should logout from current device only by default", async () => {
    const mockUserAgent = "Jest Test Browser";
    const mockUserId = "user-123";
    const mockToken = "valid-token";

    const req = createMockRequest(
      { token: mockToken },
      { "user-agent": mockUserAgent }
    );

    // Mock valid token decode
    (decodeJWT as jest.Mock).mockReturnValue({
      payload: { userId: mockUserId }
    });

    // Mock successful blacklisting
    (blacklistToken as jest.Mock).mockResolvedValue(true);

    // Mock successful refresh token deletion
    (db.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const response = await POST(req);
    const data = await response.json();

    // Check that only tokens for current device were deleted
    expect(db.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { 
        userId: mockUserId,
        deviceInfo: mockUserAgent
      }
    });

    expect(response.status).toBe(200);
    expect(data.message).toBe("Successfully logged out");
  });

  test("should logout from all devices when allDevices flag is true", async () => {
    const mockUserId = "user-123";
    const mockToken = "valid-token";

    const req = createMockRequest({
      token: mockToken,
      allDevices: true
    });

    // Mock valid token decode
    (decodeJWT as jest.Mock).mockReturnValue({
      payload: { userId: mockUserId }
    });

    // Mock successful blacklisting
    (blacklistToken as jest.Mock).mockResolvedValue(true);

    // Mock successful refresh token deletion
    (db.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

    const response = await POST(req);
    const data = await response.json();

    // Check that all tokens for the user were deleted
    expect(db.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: mockUserId }
    });

    expect(response.status).toBe(200);
    expect(data.message).toBe("Successfully logged out from all devices");
  });

  test("should handle server errors properly", async () => {
    const req = createMockRequest({ token: "valid-token" });

    // Mock valid token decode
    (decodeJWT as jest.Mock).mockReturnValue({
      payload: { userId: "user-123" }
    });

    // Mock successful blacklisting
    (blacklistToken as jest.Mock).mockResolvedValue(true);

    // Mock a database error
    (db.refreshToken.deleteMany as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await POST(req);
    const data = await response.json();

    expect(consoleSpy).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(data.error).toBe("Logout failed");

    consoleSpy.mockRestore();
  });

  test("should use 'unknown' when user-agent is not provided", async () => {
    const mockUserId = "user-123";
    const mockToken = "valid-token";

    // Create request with no user-agent header
    const req = createMockRequest({ token: mockToken });

    // Mock valid token decode
    (decodeJWT as jest.Mock).mockReturnValue({
      payload: { userId: mockUserId }
    });

    // Mock successful blacklisting
    (blacklistToken as jest.Mock).mockResolvedValue(true);

    await POST(req);

    // Check that the device info defaulted to "unknown"
    expect(db.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { 
        userId: mockUserId,
        deviceInfo: "unknown"
      }
    });
  });
});