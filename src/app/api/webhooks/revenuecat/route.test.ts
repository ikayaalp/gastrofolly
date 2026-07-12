import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const findUniqueUserMock = vi.fn();
const updateUserMock = vi.fn();
const createPaymentMock = vi.fn();
const transactionMock = vi.fn().mockImplementation(async (cb) => {
  const tx = {
    user: { update: updateUserMock },
    payment: { create: createPaymentMock },
  };
  return await cb(tx);
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => transactionMock(...args),
    user: {
      findUnique: (...args: unknown[]) => findUniqueUserMock(...args),
      update: (...args: unknown[]) => updateUserMock(...args),
    },
    payment: {
      create: (...args: unknown[]) => createPaymentMock(...args),
    },
  },
}));

const claimWebhookEventMock = vi.fn();
const hashPayloadMock = vi.fn();
vi.mock("@/lib/webhookIdempotency", () => ({
  claimWebhookEvent: (...args: unknown[]) => claimWebhookEventMock(...args),
  hashPayload: (...args: unknown[]) => hashPayloadMock(...args),
}));

import { POST } from "./route";

function createRequest(body: any, authHeader: string | null) {
  const headers = new Headers();
  if (authHeader) {
    headers.set("authorization", authHeader);
  }
  return new NextRequest("http://localhost/api/webhooks/revenuecat", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("RevenueCat Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REVENUECAT_WEBHOOK_SECRET = "test_secret";
  });

  it("eksik veya yanlış Authorization header 401 döner", async () => {
    const req = createRequest({}, "Bearer wrong_secret");
    const res = await POST(req);
    expect(res.status).toBe(401);

    const req2 = createRequest({}, null);
    const res2 = await POST(req2);
    expect(res2.status).toBe(401);
  });

  it("mükerrer event (claimWebhookEvent false) işlem yapmaz ve 200 döner", async () => {
    claimWebhookEventMock.mockResolvedValueOnce(false);

    const req = createRequest({ event: { id: "evt_1", type: "INITIAL_PURCHASE" } }, "Bearer test_secret");
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);

    expect(findUniqueUserMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("INITIAL_PURCHASE eventi için user.update ile subscription güncellenir ve payment.create çağrılır", async () => {
    claimWebhookEventMock.mockResolvedValueOnce(true);
    findUniqueUserMock.mockResolvedValueOnce({ id: "user_1", subscriptionPlan: "Free" });

    const req = createRequest(
      {
        event: {
          id: "evt_purchase",
          type: "INITIAL_PURCHASE",
          app_user_id: "user_1",
          product_id: "com.app.premium.monthly",
          expiration_at_ms: 1718000000000,
        },
      },
      "Bearer test_secret"
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(transactionMock).toHaveBeenCalled();
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        subscriptionPlan: "Premium",
        subscriptionEndDate: new Date(1718000000000),
        subscriptionStartDate: expect.any(Date),
      },
    });
    expect(createPaymentMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        status: "COMPLETED",
        subscriptionPlan: "Premium",
        billingPeriod: "monthly",
      }),
    });
  });

  it("EXPIRATION eventi için web aboneliği yoksa subscription temizlenir", async () => {
    claimWebhookEventMock.mockResolvedValueOnce(true);
    findUniqueUserMock.mockResolvedValueOnce({
      id: "user_2",
      subscriptionPlan: "Premium",
      subscriptionReferenceCode: null, // Web aboneliği yok
    });

    const req = createRequest(
      {
        event: {
          id: "evt_exp",
          type: "EXPIRATION",
          app_user_id: "user_2",
        },
      },
      "Bearer test_secret"
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(transactionMock).not.toHaveBeenCalled();
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user_2" },
      data: {
        subscriptionPlan: null,
        subscriptionEndDate: null,
        subscriptionStartDate: null,
      },
    });
  });

  it("EXPIRATION: geçerli web aboneliği VARSA subscription korunur (update çağrılmaz)", async () => {
    claimWebhookEventMock.mockResolvedValueOnce(true);
    findUniqueUserMock.mockResolvedValueOnce({
      id: "user_web",
      subscriptionPlan: "Premium",
      subscriptionReferenceCode: "IYZ_REF_123", // web (Iyzico) aboneliği var
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // gelecekte, geçerli
    });

    const req = createRequest(
      {
        event: {
          id: "evt_exp2",
          type: "EXPIRATION",
          app_user_id: "user_web",
        },
      },
      "Bearer test_secret"
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Web aboneliği geçerli olduğu için Apple süresi dolsa bile Premium korunmalı:
    // handler hiçbir user.update çağırmamalı.
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("CANCELLATION eventi için subscriptionEndDate expirationAtMs olarak güncellenir", async () => {
    claimWebhookEventMock.mockResolvedValueOnce(true);
    findUniqueUserMock.mockResolvedValueOnce({
      id: "user_3",
      subscriptionPlan: "Premium",
      subscriptionEndDate: new Date(1719000000000),
    });

    const req = createRequest(
      {
        event: {
          id: "evt_cancel",
          type: "CANCELLATION",
          app_user_id: "user_3",
          expiration_at_ms: 1718500000000,
        },
      },
      "Bearer test_secret"
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(transactionMock).not.toHaveBeenCalled();
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user_3" },
      data: {
        subscriptionEndDate: new Date(1718500000000),
      },
    });
  });
});
