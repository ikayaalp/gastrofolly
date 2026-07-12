import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth
const getServerSessionMock = vi.fn();
vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

// Mock @/lib/prisma
const findManyEnrollmentMock = vi.fn();
const findUniqueUserMock = vi.fn();
const createPaymentMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: {
      findMany: (...args: unknown[]) => findManyEnrollmentMock(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => findUniqueUserMock(...args),
    },
    payment: {
      create: (...args: unknown[]) => createPaymentMock(...args),
    },
  },
}));

// Mock @/lib/iyzico
const createCheckoutFormMock = vi.fn();
vi.mock("@/lib/iyzico", () => ({
  createCheckoutForm: (...args: unknown[]) => createCheckoutFormMock(...args),
}));

// Ignore process.env warnings or Next.js specifics
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { POST } from "./route";

function createRequest(body: any, headers: Record<string, string> = {}) {
  const reqHeaders = new Headers(headers);
  reqHeaders.set("Content-Type", "application/json");
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify(body),
  });
}

describe("Checkout Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = "http://localhost";
    
    getServerSessionMock.mockResolvedValue({
      user: { id: "user_1", email: "test@test.com" }
    });
    
    findUniqueUserMock.mockResolvedValue({
      id: "user_1",
      email: "test@test.com",
      name: "Test User",
      createdAt: new Date()
    });
  });

  it("session yoksa (kullanıcı giriş yapmamışsa) 401 döner", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const req = createRequest({ items: [{ id: "course_1" }], total: 100 });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("items (kurslar) eksik veya boşsa 400 döner", async () => {
    const req1 = createRequest({ total: 100 });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);

    const req2 = createRequest({ items: [], total: 100 });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it("kullanıcı zaten kurslara kayıtlıysa 400 döner (çift satın alma engeli)", async () => {
    findManyEnrollmentMock.mockResolvedValueOnce([{ id: "enr_1", courseId: "course_1" }]);

    const req = createRequest({ items: [{ id: "course_1", title: "Test Course", price: 100, instructor: { name: "Instructor" } }], total: 100 });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Bu kurslardan bazılarına zaten kayıtlısınız");
    expect(createPaymentMock).not.toHaveBeenCalled();
    expect(createCheckoutFormMock).not.toHaveBeenCalled();
  });

  it("geçerli istekte PENDING payment oluşturulur ve Iyzico createCheckoutForm çağrılır", async () => {
    findManyEnrollmentMock.mockResolvedValueOnce([]);
    createCheckoutFormMock.mockResolvedValueOnce({
      status: "success",
      paymentPageUrl: "https://iyzi.co/payment",
      checkoutFormContent: "<form>...</form>",
      token: "iyzico_token_123"
    });

    const items = [
      { id: "course_1", title: "Test Course", price: 100, instructor: { name: "Instructor" } }
    ];

    const req = createRequest({ items, total: 100 }, { "x-forwarded-for": "127.0.0.1" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    
    expect(createCheckoutFormMock).toHaveBeenCalled();
    const paymentRequest = createCheckoutFormMock.mock.calls[0][0];
    expect(paymentRequest.buyer.id).toBe("user_1");
    // KDV'li fiyat: 100 * 1.18 = 118
    expect(paymentRequest.price).toBe("118.00");
    
    expect(createPaymentMock).toHaveBeenCalledTimes(1);
    expect(createPaymentMock).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        courseId: "course_1",
        amount: 118,
        currency: "TRY",
        status: "PENDING",
        stripePaymentId: expect.any(String), // conversationId saklanır
      }
    });

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.token).toBe("iyzico_token_123");
  });
});
