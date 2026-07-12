import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @/lib/prisma
const findUniqueMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      create: (...args: unknown[]) => createMock(...args),
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

// Mock @/lib/generateUsername
const generateUniqueUsernameMock = vi.fn();
vi.mock("@/lib/generateUsername", () => ({
  generateUniqueUsername: (...args: unknown[]) => generateUniqueUsernameMock(...args),
}));

// Mock fetch globally
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { POST } from "./route";

function createRequest(body: any) {
  return new NextRequest("http://localhost/api/auth/google-mobile", {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

const VALID_CLIENT_ID = "334630749775-terb1dfppb1atgem3t1pc0o41chaj3r1.apps.googleusercontent.com";

describe("Google Mobile Auth Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test_secret";
    checkRateLimitMock.mockResolvedValue({ success: true });
    getClientIpMock.mockReturnValue("127.0.0.1");
  });

  it("rate limit aşıldıysa 429 döner", async () => {
    checkRateLimitMock.mockResolvedValueOnce({ success: false });

    const req = createRequest({ idToken: "token123", email: "test@test.com" });
    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it("idToken veya email eksikse 400 döner", async () => {
    const req1 = createRequest({ idToken: "token123" });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);

    const req2 = createRequest({ email: "test@test.com" });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it("fetch ok: false dönerse (geçersiz Google token) 401 döner", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });

    const req = createRequest({ idToken: "invalid_token", email: "test@test.com" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe("Geçersiz Google token");
  });

  it("aud allowlist'te değilse 401 döner", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aud: "invalid-client-id.apps.googleusercontent.com", email: "test@test.com" })
    });

    const req = createRequest({ idToken: "token123", email: "test@test.com" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe("Geçersiz Google client ID");
  });

  it("googleData.email !== email ise 401 döner", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aud: VALID_CLIENT_ID, email: "other@test.com" })
    });

    const req = createRequest({ idToken: "token123", email: "test@test.com" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe("Email doğrulanamadı");
  });

  it("geçerli bilgilerle mevcut kullanıcıyı bulur ve token döner", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aud: VALID_CLIENT_ID, email: "test@test.com" })
    });

    findUniqueMock.mockResolvedValueOnce({
      id: "user_123",
      email: "test@test.com",
      role: "STUDENT",
      emailVerified: new Date(),
    });

    const req = createRequest({ idToken: "token123", email: "test@test.com" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user_123" },
      data: { currentSessionId: expect.any(String) }
    });
    
    const json = await res.json();
    expect(json.token).toBeDefined();
    expect(json.user.id).toBe("user_123");
  });

  it("geçerli bilgilerle yeni kullanıcı oluşturur ve token döner", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aud: VALID_CLIENT_ID, email: "new@test.com", name: "New User", picture: "pic.jpg" })
    });

    findUniqueMock.mockResolvedValueOnce(null);
    generateUniqueUsernameMock.mockResolvedValueOnce("newuser123");
    
    createMock.mockResolvedValueOnce({
      id: "user_new",
      email: "new@test.com",
      role: "STUDENT",
    });

    const req = createRequest({ idToken: "token123", email: "new@test.com", name: "New User", picture: "pic.jpg" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createMock).toHaveBeenCalled();
    const createArgs = createMock.mock.calls[0][0];
    expect(createArgs.data.email).toBe("new@test.com");
    expect(createArgs.data.username).toBe("newuser123");

    const json = await res.json();
    expect(json.token).toBeDefined();
    expect(json.user.id).toBe("user_new");
  });
});
