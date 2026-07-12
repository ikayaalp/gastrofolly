import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @/lib/prisma
const findUniqueMock = vi.fn();
const updateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
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

// Mock bcryptjs
const compareMock = vi.fn();
vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => compareMock(...args),
  },
}));

import { POST } from "./route";

function createRequest(body: any) {
  return new NextRequest("http://localhost/api/auth/mobile-login", {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

describe("Mobile Login Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test_secret";
    // Default mock implementation to allow success scenarios to pass
    checkRateLimitMock.mockResolvedValue({ success: true });
    getClientIpMock.mockReturnValue("127.0.0.1");
  });

  it("rate limit aşıldıysa 429 döner", async () => {
    checkRateLimitMock.mockResolvedValueOnce({ success: false });

    const req = createRequest({ email: "test@test.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.message).toContain("Çok fazla başarısız deneme");
  });

  it("email veya şifre eksikse 400 döner", async () => {
    const req1 = createRequest({ email: "test@test.com" });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);

    const req2 = createRequest({ password: "password123" });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it("kullanıcı bulunamazsa 401 döner", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const req = createRequest({ email: "test@test.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe("Geçersiz email veya şifre");
  });

  it("şifre yanlışsa (bcrypt.compare false) 401 döner", async () => {
    findUniqueMock.mockResolvedValueOnce({ email: "test@test.com", password: "hashed_password" });
    compareMock.mockResolvedValueOnce(false);

    const req = createRequest({ email: "test@test.com", password: "wrong_password" });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("emailVerified yoksa (doğrulanmamışsa) 403 döner", async () => {
    findUniqueMock.mockResolvedValueOnce({ 
      email: "test@test.com", 
      password: "hashed_password",
      emailVerified: null 
    });
    compareMock.mockResolvedValueOnce(true);

    const req = createRequest({ email: "test@test.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toBe("Email adresiniz doğrulanmamış");
  });

  it("başarılı girişte currentSessionId set edilir ve token döner (200)", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_123",
      email: "test@test.com",
      password: "hashed_password",
      emailVerified: new Date(),
      role: "STUDENT",
      name: "Test User"
    });
    compareMock.mockResolvedValueOnce(true);

    const req = createRequest({ email: "test@test.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user_123" },
      data: { currentSessionId: expect.any(String) }
    });

    expect(json.token).toBeDefined();
    expect(json.user.id).toBe("user_123");
    expect(json.user.email).toBe("test@test.com");
  });
});
