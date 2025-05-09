// app/api/auth/refresh/refresh.test.ts

import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/refresh/route";
import { useRefreshToken } from "@/app/lib/jwt";

// Mock dependencies
jest.mock("@/app/lib/jwt", () => ({
  useRefreshToken: jest.fn()
}));

describe("Refresh Token API Route", () => {
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

  test("should return 401 if refresh token is missing", async () => {
    const req = createMockRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No refresh token provided");
  });

  test("should return 401 if refresh token is invalid or expired", async () => {
    const req = createMockRequest({ 
      refreshToken: "invalid-refresh-token" 
    });

    // Mock useRefreshToken to return null (invalid token)
    (useRefreshToken as jest.Mock).mockResolvedValue(null);

    const response = await POST(req);
    const data = await response.json();

    expect(useRefreshToken).toHaveBeenCalledWith("invalid-refresh-token", "unknown");
    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid or expired refresh token");
  });

  test("should return new token pair on successful refresh", async () => {
    const mockRefreshToken = "valid-refresh-token";
    const mockUserAgent = "Jest Test Browser";
    
    const req = createMockRequest(
      { refreshToken: mockRefreshToken },
      { "user-agent": mockUserAgent }
    );

    // Mock successful token refresh
    const mockTokens = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      expiresIn: 3600
    };
    (useRefreshToken as jest.Mock).mockResolvedValue(mockTokens);

    const response = await POST(req);
    const data = await response.json();

    // Check that refresh token was used with correct parameters
    expect(useRefreshToken).toHaveBeenCalledWith(mockRefreshToken, mockUserAgent);
    
    // Check response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
      expiresIn: mockTokens.expiresIn
    });
  });

  test("should handle user agent correctly when not provided", async () => {
    const mockRefreshToken = "valid-refresh-token";
    
    // Create request with no user-agent header
    const req = createMockRequest({ refreshToken: mockRefreshToken });

    // Mock successful token refresh
    const mockTokens = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      expiresIn: 3600
    };
    (useRefreshToken as jest.Mock).mockResolvedValue(mockTokens);

    await POST(req);

    // Check that refresh token was used with "unknown" user agent
    expect(useRefreshToken).toHaveBeenCalledWith(mockRefreshToken, "unknown");
  });

  test("should return 500 when an unexpected error occurs", async () => {
    const req = createMockRequest({ refreshToken: "valid-token" });

    // Mock an error in the refresh token process
    (useRefreshToken as jest.Mock).mockRejectedValue(new Error("Token validation error"));
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await POST(req);
    const data = await response.json();

    expect(consoleSpy).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(data.error).toBe("Token refresh failed");

    consoleSpy.mockRestore();
  });
});