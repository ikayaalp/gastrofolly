import { describe, it, expect } from "vitest"
import { validatePassword } from "./passwordValidator"

describe("validatePassword", () => {
  it("kısa şifreyi reddeder", () => {
    const result = validatePassword("Ab1!")
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain("En az 8 karakter olmalıdır")
  })

  it("büyük harf, küçük harf, rakam ve özel karakter içermeyen şifreleri reddeder", () => {
    expect(validatePassword("alllowercase1!").errors).toContain("En az 1 büyük harf içermelidir")
    expect(validatePassword("ALLUPPERCASE1!").errors).toContain("En az 1 küçük harf içermelidir")
    expect(validatePassword("NoDigitsHere!").errors).toContain("En az 1 rakam içermelidir")
    expect(validatePassword("NoSpecial123").errors).toContain(
      "En az 1 özel karakter içermelidir (!@#$%^&*)"
    )
  })

  it("tüm kriterleri sağlayan şifreyi geçerli sayar", () => {
    const result = validatePassword("GucluSifre1!")
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("kayıt/şifre değiştirme akışında kullanılan zayıf/orta/güçlü sınıflandırması doğru çalışır", () => {
    expect(validatePassword("weak").strength).toBe("weak")
    expect(validatePassword("Medium123!").strength).toBe("medium")
    expect(validatePassword("CokGucluSifre123!").strength).toBe("strong")
  })
})
