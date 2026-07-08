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
}

// DB kayıtlarını varsayılanlarla birleştirir: DB'de olmayan bölümler
// varsayılan sıralarıyla eklenir, geçersiz key'ler atılır.
export function resolveHomeSections(
  dbSections: { key: string; label: string; order: number; isVisible: boolean }[]
): ResolvedHomeSection[] {
  const byKey = new Map(dbSections.map((s) => [s.key, s]))

  return DEFAULT_HOME_SECTIONS.map((def, index) => {
    const existing = byKey.get(def.key)
    return {
      key: def.key,
      label: existing?.label || def.label,
      order: existing?.order ?? index,
      isVisible: existing?.isVisible ?? true,
    }
  }).sort((a, b) => a.order - b.order)
}
