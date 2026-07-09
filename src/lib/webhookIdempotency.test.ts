import { describe, it, expect, vi, beforeEach } from "vitest"

// prisma.webhookEvent.create'i mock'luyoruz — gerçek DB'ye dokunmadan
// idempotency mantığını (unique constraint = kilit) test edebilmek için.
const createMock = vi.fn()
vi.mock("./prisma", () => ({
  prisma: {
    webhookEvent: {
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}))

import { claimWebhookEvent, hashPayload } from "./webhookIdempotency"

describe("claimWebhookEvent", () => {
  beforeEach(() => {
    createMock.mockReset()
  })

  it("olay ilk kez geliyorsa true döner (create başarılı)", async () => {
    createMock.mockResolvedValueOnce({ id: "1" })
    const result = await claimWebhookEvent("stripe", "evt_123")
    expect(result).toBe(true)
    expect(createMock).toHaveBeenCalledWith({
      data: { source: "stripe", dedupeKey: "stripe:evt_123" },
    })
  })

  it("aynı olay ikinci kez gelirse false döner (P2002 unique constraint)", async () => {
    const p2002Error = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    })
    createMock.mockRejectedValueOnce(p2002Error)

    const result = await claimWebhookEvent("stripe", "evt_123")
    // Bu, tam olarak Stripe/Iyzico/RevenueCat'in retry gönderdiğinde
    // ödemenin İKİNCİ KEZ işlenmemesini garanti eden davranış.
    expect(result).toBe(false)
  })

  it("P2002 dışındaki bir hata varsa (örn. DB bağlantı hatası) yutulmaz, fırlatılır", async () => {
    const otherError = Object.assign(new Error("Connection refused"), {
      code: "P1001",
    })
    createMock.mockRejectedValueOnce(otherError)

    await expect(claimWebhookEvent("iyzico", "abc")).rejects.toThrow(
      "Connection refused"
    )
  })

  it("farklı source'lar aynı dedupeKey ile çakışmaz (namespace ayrımı)", async () => {
    createMock.mockResolvedValueOnce({ id: "1" })
    await claimWebhookEvent("stripe", "same-key")
    expect(createMock).toHaveBeenLastCalledWith({
      data: { source: "stripe", dedupeKey: "stripe:same-key" },
    })

    createMock.mockResolvedValueOnce({ id: "2" })
    await claimWebhookEvent("iyzico", "same-key")
    expect(createMock).toHaveBeenLastCalledWith({
      data: { source: "iyzico", dedupeKey: "iyzico:same-key" },
    })
  })
})

describe("hashPayload", () => {
  it("aynı payload için deterministik olarak aynı hash'i üretir", () => {
    const payload = { iyziEventType: "subscription.order.success", subscriptionReferenceCode: "ref1" }
    expect(hashPayload(payload)).toBe(hashPayload(payload))
  })

  it("farklı payload'lar için farklı hash üretir", () => {
    const a = { subscriptionReferenceCode: "ref1" }
    const b = { subscriptionReferenceCode: "ref2" }
    expect(hashPayload(a)).not.toBe(hashPayload(b))
  })

  it("64 karakterlik hex sha256 hash döner", () => {
    const hash = hashPayload({ foo: "bar" })
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })
})
