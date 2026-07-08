// /home anasayfasının yeniden sıralanabilir bölümleri.
// "hero" bölümü sabittir (her zaman en üstte) ve buraya dahil değildir;
// hero görselleri HomeCover ile yönetilir.

export interface HomeSectionDef {
  key: string
  label: string
}

// Varsayılan sıra. HomeSection tablosu boşsa /home bu sırayı kullanır.
export const DEFAULT_HOME_SECTIONS: HomeSectionDef[] = [
  { key: "continue", label: "Kaldığın Yerden Devam Et" },
  { key: "stories", label: "Hikayeler" },
  { key: "featured", label: "Öne Çıkan Kurslar" },
  { key: "popular", label: "Popüler Kurslar" },
  { key: "instructors", label: "Eğitmenlerimiz" },
  { key: "recent", label: "Yeni Eklenen Kurslar" },
  { key: "categories", label: "Kategorilere Göre Kurslar" },
]

export const HOME_SECTION_KEYS = DEFAULT_HOME_SECTIONS.map((s) => s.key)

export interface ResolvedHomeSection {
  key: string
  label: string
  order: number
  isVisible: boolean
  isCustom?: boolean
  courseIds?: string[] // Admin paneli için kurs id listesi
  courses?: any[]      // Client tarafı için dolu kurs objeleri listesi (opsiyonel)
}

// DB kayıtlarını varsayılanlarla birleştirir: DB'de olmayan varsayılan bölümler eklenir,
// özel (isCustom=true) olanlar da listeye dahil edilir.
export function resolveHomeSections(
  dbSections: any[]
): ResolvedHomeSection[] {
  const byKey = new Map(dbSections.map((s) => [s.key, s]))

  // 1. Varsayılan bölümleri ekle
  const result: ResolvedHomeSection[] = DEFAULT_HOME_SECTIONS.map((def, index) => {
    const existing = byKey.get(def.key)
    return {
      key: def.key,
      label: existing?.label || def.label,
      order: existing?.order ?? index,
      isVisible: existing?.isVisible ?? true,
      isCustom: false
    }
  })

  // 2. Özel (custom) bölümleri ekle
  dbSections.forEach((s) => {
    if (s.isCustom || s.key.startsWith("custom-")) {
      result.push({
        key: s.key,
        label: s.label,
        order: s.order,
        isVisible: s.isVisible,
        isCustom: true,
        courseIds: s.courses ? s.courses.map((sc: any) => sc.courseId) : [],
        courses: s.courses ? s.courses.map((sc: any) => sc.course) : []
      })
    }
  })

  // 3. Sıraya göre diz
  return result.sort((a, b) => a.order - b.order)
}
