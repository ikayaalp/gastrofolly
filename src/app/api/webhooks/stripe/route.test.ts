import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const updateManyMock = vi.fn();
const createMock = vi.fn();
const transactionMock = vi.fn().mockImplementation(async (cb) => {
  const tx = {
    payment: { updateMany: updateManyMock },
    enrollment: { create: createMock },
  };
  return await cb(tx);
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => transactionMock(...args),
    payment: {
      updateMany: (...args: unknown[]) => updateManyMock(...args),
    },
  },
}));

const constructEventMock = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => constructEventMock(...args),
    },
  },
}));

const claimWebhookEventMock = vi.fn();
vi.mock("@/lib/webhookIdempotency", () => ({
  claimWebhookEvent: (...args: unknown[]) => claimWebhookEventMock(...args),
}));

import { POST } from "./route";

function createRequest(body: any, signature: string | null) {
  const headers = new Headers();
  if (signature) {
    headers.set("stripe-signature", signature);
  }
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("Stripe Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stripe-signature header yoksa 400 döner", async () => {
    const req = createRequest({}, null);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No signature provided");
  });

  it("constructEvent hata fırlatırsa (geçersiz imza) 400 döner", async () => {
    constructEventMock.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });
    const req = createRequest({}, "invalid_sig");
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid signature");
  });

  it("claimWebhookEvent false dönerse (mükerrer) 200 döner ve işlem yapmaz", async () => {
    constructEventMock.mockReturnValueOnce({ id: "evt_duplicate", type: "some_type" });
    claimWebhookEventMock.mockResolvedValueOnce(false);

    const req = createRequest({}, "valid_sig");
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    expect(transactionMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json.duplicate).toBe(true);
  });

  it("checkout.session.completed eventi için Payment COMPLETED'a güncellenir ve enrollment oluşturulur", async () => {
    constructEventMock.mockReturnValueOnce({
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_123",
          metadata: {
            userId: "user_1",
            courseIds: JSON.stringify(["course_1", "course_2"]),
          },
        },
      },
    });
    claimWebhookEventMock.mockResolvedValueOnce(true);

    const req = createRequest({}, "valid_sig");
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(transactionMock).toHaveBeenCalled();
    
    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        stripePaymentId: "cs_123",
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
      },
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock).toHaveBeenCalledWith({ data: { userId: "user_1", courseId: "course_1" } });
    expect(createMock).toHaveBeenCalledWith({ data: { userId: "user_1", courseId: "course_2" } });
  });

  it("payment_intent.payment_failed eventi için Payment FAILED olarak güncellenir", async () => {
    constructEventMock.mockReturnValueOnce({
      id: "evt_fail",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          metadata: {
            userId: "user_fail",
            courseId: "course_fail",
          },
        },
      },
    });
    claimWebhookEventMock.mockResolvedValueOnce(true);

    const req = createRequest({}, "valid_sig");
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user_fail",
        courseId: "course_fail",
        status: "PENDING",
      },
      data: {
        status: "FAILED",
      },
    });
    // işlem transaction içinde değil, doğrudan prisma üzerinden çağrılıyor
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
