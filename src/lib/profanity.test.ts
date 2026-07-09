import { describe, it, expect } from "vitest"
import { containsProfanity } from "./profanity"

describe("containsProfanity", () => {
  it("boş/undefined metin için false döner", () => {
    expect(containsProfanity("")).toBe(false)
  })

  it("temiz bir forum başlığı/yorumu için false döner", () => {
    expect(containsProfanity("Bu tarif harika, teşekkürler şef!")).toBe(false)
  })

  it("küfür içeren metni tespit eder", () => {
    expect(containsProfanity("bu siktir bir tarif")).toBe(true)
  })

  it("büyük/küçük harf duyarsız çalışır", () => {
    expect(containsProfanity("SIKTIR bir tarif")).toBe(true)
  })

  it("kelime sınırı kullanır — 'am' gibi kısa kelimeler 'tamam' içinde yanlış tetiklenmez", () => {
    expect(containsProfanity("tamam, anladım")).toBe(false)
    expect(containsProfanity("saman altında su yürütmek")).toBe(false)
  })
})
