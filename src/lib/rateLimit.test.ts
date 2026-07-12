import { describe, it, expect } from "vitest"
import { checkRateLimit, getClientIp } from "./rateLimit"

// Her testte benzersiz bir identifier kullanılır ki modül-seviyesindeki
// paylaşılan store testler arasında birbirini etkilemesin.
function uniqueId(prefix: string) {
  return `${prefix}:${Math.random().toString(36).slice(2)}`
}

describe("checkRateLimit", () => {
  it("izin verilen sayıya kadar isteklere success döner", async () => {
    const id = uniqueId("allow")
    const opts = { maxRequests: 3, windowSeconds: 60 }

    expect((await checkRateLimit(id, opts)).success).toBe(true)
    expect((await checkRateLimit(id, opts)).success).toBe(true)
    expect((await checkRateLimit(id, opts)).success).toBe(true)
  })

  it("limit aşıldığında success:false döner (login brute-force koruması)", async () => {
    const id = uniqueId("login-bruteforce")
    const opts = { maxRequests: 5, windowSeconds: 60 }

    for (let i = 0; i < 5; i++) {
      expect((await checkRateLimit(id, opts)).success).toBe(true)
    }
    // 6. istek: limit aşıldı
    const result = await checkRateLimit(id, opts)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("farklı identifier'lar birbirinden bağımsızdır (bir kullanıcının denemesi başkasını etkilemez)", async () => {
    const idA = uniqueId("user-a")
    const idB = uniqueId("user-b")
    const opts = { maxRequests: 1, windowSeconds: 60 }

    expect((await checkRateLimit(idA, opts)).success).toBe(true)
    expect((await checkRateLimit(idA, opts)).success).toBe(false) // A limitine takıldı
    expect((await checkRateLimit(idB, opts)).success).toBe(true) // B hâlâ serbest
  })

  it("remaining sayacı doğru azalır", async () => {
    const id = uniqueId("remaining")
    const opts = { maxRequests: 3, windowSeconds: 60 }

    expect((await checkRateLimit(id, opts)).remaining).toBe(2)
    expect((await checkRateLimit(id, opts)).remaining).toBe(1)
    expect((await checkRateLimit(id, opts)).remaining).toBe(0)
  })
})

describe("getClientIp", () => {
  it("x-forwarded-for header'ından ilk IP'yi alır", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("x-forwarded-for yoksa x-real-ip'e düşer", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "9.9.9.9" },
    })
    expect(getClientIp(req)).toBe("9.9.9.9")
  })

  it("hiçbir header yoksa 'unknown' döner", () => {
    const req = new Request("https://example.com")
    expect(getClientIp(req)).toBe("unknown")
  })
})
