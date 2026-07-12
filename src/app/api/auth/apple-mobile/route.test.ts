import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @/lib/prisma
const findUniqueAccountMock = vi.fn();
const findUniqueUserMock = vi.fn();
const createAccountMock = vi.fn();
const createUserMock = vi.fn();
const updateUserMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findUnique: (...args: unknown[]) => findUniqueAccountMock(...args),
      create: (...args: unknown[]) => createAccountMock(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => findUniqueUserMock(...args),
      create: (...args: unknown[]) => createUserMock(...args),
      update: (...args: unknown[]) => updateUserMock(...args),
    },
  },
}));

// Mock @/lib/rateLimit
const checkRateLimitMock = vi.fn();
const getClientIpMock = vi.fn();
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getClientIp: (...args: unknown[]) => getClientIpMock(...args),
  RATE_LIMITS: { AUTH: 5 },
}));

// Mock @/lib/generateUsername
const generateUniqueUsernameMock = vi.fn();
vi.mock("@/lib/generateUsername", () => ({
  generateUniqueUsername: (...args: unknown[]) => generateUniqueUsernameMock(...args),
}));

// Mock jose
const jwtVerifyMock = vi.fn();
vi.mock("jose", () => ({
  jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
  createRemoteJWKSet: vi.fn(() => "MOCK_JWKS"),
}));

import { POST } from "./route";

function createRequest(body: any) {
  return new NextRequest("http://localhost/api/auth/apple-mobile", {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

describe("Apple Mobile Auth Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test_secret";
    checkRateLimitMock.mockResolvedValue({ success: true });
    getClientIpMock.mockReturnValue("127.0.0.1");
  });

  it("rate limit aşıldıysa 429 döner", async () => {
    checkRateLimitMock.mockResolvedValueOnce({ success: false });

    const req = createRequest({ identityToken: "token123", email: "test@apple.com" });
    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it("identityToken eksikse 400 döner", async () => {
    const req = createRequest({ email: "test@apple.com" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("identityToken backend'e ulaşmadı");
  });

  it("jwtVerify hata fırlatırsa (geçersiz imza) 401 döner", async () => {
    jwtVerifyMock.mockRejectedValueOnce(new Error("Invalid signature"));

    const req = createRequest({ identityToken: "invalid_token" });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("geçerli bilgilerle mevcut kullanıcıyı bulur ve token döner", async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: { sub: "apple_sub_123", email: "test@apple.com" }
    });

    findUniqueAccountMock.mockResolvedValueOnce({
      user: {
        id: "user_apple",
        email: "test@apple.com",
        role: "STUDENT"
      }
    });

    const req = createRequest({ identityToken: "valid_token" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user_apple" },
      data: { currentSessionId: expect.any(String) }
    });

    const json = await res.json();
    expect(json.token).toBeDefined();
    expect(json.user.id).toBe("user_apple");
  });

  it("Apple hesabı yoksa email ile bulur, bağlı hesap oluşturur ve token döner", async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: { sub: "apple_sub_456", email: "existing@apple.com" }
    });

    findUniqueAccountMock.mockResolvedValueOnce(null);
    findUniqueUserMock.mockResolvedValueOnce({
      id: "user_existing",
      email: "existing@apple.com",
      role: "STUDENT"
    });

    const req = createRequest({ identityToken: "valid_token" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createAccountMock).toHaveBeenCalledWith({
      data: {
        userId: "user_existing",
        type: "oauth",
        provider: "apple",
        providerAccountId: "apple_sub_456"
      }
    });
    
    const json = await res.json();
    expect(json.token).toBeDefined();
    expect(json.user.id).toBe("user_existing");
  });

  it("geçerli bilgilerle yeni kullanıcı oluşturur ve token döner", async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: { sub: "apple_sub_new", email: "new@apple.com" }
    });

    findUniqueAccountMock.mockResolvedValueOnce(null);
    findUniqueUserMock.mockResolvedValueOnce(null);
    generateUniqueUsernameMock.mockResolvedValueOnce("newapple123");
    
    createUserMock.mockResolvedValueOnce({
      id: "user_new_apple",
      email: "new@apple.com",
      role: "STUDENT"
    });

    const req = createRequest({ identityToken: "valid_token" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createUserMock).toHaveBeenCalled();
    const createArgs = createUserMock.mock.calls[0][0];
    expect(createArgs.data.email).toBe("new@apple.com");
    expect(createArgs.data.username).toBe("newapple123");

    const json = await res.json();
    expect(json.token).toBeDefined();
    expect(json.user.id).toBe("user_new_apple");
  });
});
