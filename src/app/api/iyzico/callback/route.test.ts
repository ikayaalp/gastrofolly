import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @/lib/prisma
const findManyPaymentMock = vi.fn();
const findFirstPaymentMock = vi.fn();
const updatePaymentMock = vi.fn();
const updateUserMock = vi.fn();
const findFirstEnrollmentMock = vi.fn();
const createEnrollmentMock = vi.fn();

const transactionMock = vi.fn().mockImplementation(async (cb) => {
  const tx = {
    payment: { update: updatePaymentMock },
    user: { update: updateUserMock },
    enrollment: {
      findFirst: findFirstEnrollmentMock,
      create: createEnrollmentMock,
    },
  };
  return await cb(tx);
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => transactionMock(...args),
    payment: {
      findMany: (...args: unknown[]) => findManyPaymentMock(...args),
      findFirst: (...args: unknown[]) => findFirstPaymentMock(...args),
    },
  },
}));

// Mock @/lib/iyzico
const retrieveSubscriptionCheckoutFormMock = vi.fn();
vi.mock("@/lib/iyzico", () => ({
  retrieveSubscriptionCheckoutForm: (...args: unknown[]) => retrieveSubscriptionCheckoutFormMock(...args),
}));

// Mock @/lib/emailService
const sendSubscriptionStartedEmailMock = vi.fn();
vi.mock("@/lib/emailService", () => ({
  sendSubscriptionStartedEmail: (...args: unknown[]) => sendSubscriptionStartedEmailMock(...args),
}));

import { GET } from "./route";

function createGetRequest(token: string | null) {
  const url = new URL("http://localhost/api/iyzico/callback");
  if (token) {
    url.searchParams.set("token", token);
  }
  return new NextRequest(url.toString(), {
    method: "GET",
  });
}

describe("Iyzico Callback GET Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("token yoksa ödeme doğrulanmaz ve token missing hatasıyla yönlendirilir", async () => {
    const req = createGetRequest(null);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("checkout?error=payment_token_missing");
    expect(retrieveSubscriptionCheckoutFormMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("ödeme başarısızsa veya bekleyen (PENDING) ödeme bulunamazsa abonelik açılmaz", async () => {
    retrieveSubscriptionCheckoutFormMock.mockResolvedValueOnce({
      status: "failure",
      errorMessage: "Yetersiz bakiye",
      errorCode: "1003",
    });

    const req = createGetRequest("token_fail");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("checkout?error=Yetersiz%20bakiye");
    
    // İşlem başarısız olduğu için veritabanı mutasyonları yapılmamalıdır
    expect(transactionMock).not.toHaveBeenCalled();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("ödeme başarılıysa ve PENDING payment varsa ödeme COMPLETED yapılır ve abonelik açılır", async () => {
    retrieveSubscriptionCheckoutFormMock.mockResolvedValueOnce({
      status: "success",
      subscriptionStatus: "ACTIVE",
      conversationId: "conv_123",
      referenceCode: "ref_123",
    });

    findManyPaymentMock.mockResolvedValueOnce([
      {
        id: "payment_1",
        userId: "user_1",
        status: "PENDING",
        subscriptionPlan: "Premium",
        billingPeriod: "monthly",
      },
    ]);

    // email için dönecek sahte user objesi
    updateUserMock.mockResolvedValueOnce({
      id: "user_1",
      email: "test@test.com",
      name: "Test User",
    });

    const req = createGetRequest("token_success");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    // Başarılı olduğunda kurslarım sayfasına yönlendirir
    expect(text).toContain("window.location.href = '/my-courses';");

    expect(transactionMock).toHaveBeenCalled();
    
    // Payment update assertion
    expect(updatePaymentMock).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: {
        status: "COMPLETED",
        stripePaymentId: "ref_123",
      },
    });

    // User subscription update assertion
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        subscriptionPlan: "Premium",
        subscriptionBillingPeriod: "MONTHLY",
        subscriptionStartDate: expect.any(Date),
        subscriptionEndDate: expect.any(Date),
        subscriptionReferenceCode: "ref_123",
        subscriptionCancelled: false,
      },
    });

    // Email send assertion
    expect(sendSubscriptionStartedEmailMock).toHaveBeenCalledWith(
      "test@test.com",
      "Test User",
      "Premium",
      expect.any(Date)
    );
  });
});
