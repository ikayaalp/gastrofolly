import { describe, it, expect } from "vitest"
import { resolveHomeSections, DEFAULT_HOME_SECTIONS, HOME_SECTION_KEYS } from "./homeSections"

describe("resolveHomeSections", () => {
  it("DB kaydı hiç yoksa varsayılan bölümleri sırasıyla döner", () => {
    const result = resolveHomeSections([])
    expect(result.map((s) => s.key)).toEqual(HOME_SECTION_KEYS)
    expect(result.every((s) => s.isVisible)).toBe(true)
  })

  it("DB'deki sıra/görünürlük varsayılanın üzerine yazılır", () => {
    // -1 ve 99 kullanılıyor ki diğer varsayılan bölümlerin (0-6 arası
    // index tabanlı sırası) hiçbiriyle çakışmasın, sıralama sonucu net olsun.
    const dbSections = [
      { key: "instructors", label: "Eğitmenlerimiz", order: -1, isVisible: true, isCustom: false },
      { key: "featured", label: "Öne Çıkan Kurslar", order: 99, isVisible: false, isCustom: false },
    ]
    const result = resolveHomeSections(dbSections)

    const instructors = result.find((s) => s.key === "instructors")
    const featured = result.find((s) => s.key === "featured")

    expect(instructors?.order).toBe(-1)
    expect(featured?.isVisible).toBe(false)
    // Sıralama order'a göre olmalı — instructors en öne, featured en sona gelmeli
    expect(result[0].key).toBe("instructors")
    expect(result[result.length - 1].key).toBe("featured")
  })

  it("özel (custom) bölümler sonuca eklenir ve kursları doğru unwrap edilir", () => {
    const dbSections = [
      {
        key: "custom-123",
        label: "Yaz Seçkisi",
        order: 5,
        isVisible: true,
        isCustom: true,
        courses: [
          { courseId: "c1", course: { id: "c1", title: "Kurs 1" } },
          { courseId: "c2", course: { id: "c2", title: "Kurs 2" } },
        ],
      },
    ]
    const result = resolveHomeSections(dbSections)
    const custom = result.find((s) => s.key === "custom-123")

    expect(custom).toBeDefined()
    expect(custom?.isCustom).toBe(true)
    expect(custom?.courseIds).toEqual(["c1", "c2"])
    // courses alanı DÜZ Course objeleri olmalı (join satırı değil) —
    // mobil tarafta yaşanan "section.courses.map(c => c.course)" hatasının
    // aynısını tekrar etmemek için bu davranış kritik.
    expect(custom?.courses).toEqual([
      { id: "c1", title: "Kurs 1" },
      { id: "c2", title: "Kurs 2" },
    ])
  })

  it("varsayılan bölüm sayısı DEFAULT_HOME_SECTIONS ile tutarlıdır", () => {
    const result = resolveHomeSections([])
    expect(result.length).toBe(DEFAULT_HOME_SECTIONS.length)
  })
})
