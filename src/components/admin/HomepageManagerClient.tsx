"use client"

import { useState } from "react"
import {
  Image as ImageIcon,
  Users,
  ListOrdered,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react"
import ImageUpload from "@/components/admin/ImageUpload"

// ---- Tipler ----
interface Cover {
  id: string
  imageUrl: string
  title: string | null
  subtitle: string | null
  linkUrl: string | null
  order: number
  isActive: boolean
}

interface HInstructor {
  id: string
  name: string
  subtitle: string | null
  imageUrl: string | null
  linkUrl: string | null
  order: number
  isActive: boolean
  email?: string | null
  userId?: string | null
  // Sadece formda kullanılan geçici alan (sunucudan gelmez)
  password?: string
}

interface Section {
  key: string
  label: string
  order: number
  isVisible: boolean
}

interface Props {
  initialCovers: Cover[]
  initialInstructors: HInstructor[]
  initialSections: Section[]
}

type Tab = "covers" | "instructors" | "sections"

const inputCls =
  "w-full px-3 py-2 bg-neutral-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
const labelCls = "block text-xs font-medium text-gray-400 mb-1"

export default function HomepageManagerClient({
  initialCovers,
  initialInstructors,
  initialSections,
}: Props) {
  const [tab, setTab] = useState<Tab>("covers")

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white">Anasayfa Yönetimi</h1>
        <p className="text-gray-400 mt-1">
          Giriş yapmış kullanıcıların gördüğü anasayfayı (/home) buradan yönetin.
        </p>
      </div>

      {/* Sekmeler */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "covers"} onClick={() => setTab("covers")} icon={ImageIcon}>
          Kapak Görselleri
        </TabButton>
        <TabButton active={tab === "instructors"} onClick={() => setTab("instructors")} icon={Users}>
          Eğitmenler
        </TabButton>
        <TabButton active={tab === "sections"} onClick={() => setTab("sections")} icon={ListOrdered}>
          Bölüm Sırası
        </TabButton>
      </div>

      {tab === "covers" && <CoversTab initial={initialCovers} />}
      {tab === "instructors" && <InstructorsTab initial={initialInstructors} />}
      {tab === "sections" && <SectionsTab initial={initialSections} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-orange-600 text-white"
          : "bg-neutral-900 text-gray-400 hover:text-white border border-gray-800"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

// ========================= KAPAKLAR =========================
function CoversTab({ initial }: { initial: Cover[] }) {
  const [covers, setCovers] = useState<Cover[]>(initial)
  const [savingId, setSavingId] = useState<string | null>(null)

  const addNew = () => {
    setCovers((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        imageUrl: "",
        title: "",
        subtitle: "",
        linkUrl: "",
        order: prev.length,
        isActive: true,
      },
    ])
  }

  const update = (id: string, field: keyof Cover, value: unknown) => {
    setCovers((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const save = async (cover: Cover) => {
    if (!cover.imageUrl) {
      alert("Önce bir görsel yükleyin.")
      return
    }
    setSavingId(cover.id)
    try {
      const isNew = cover.id.startsWith("new-")
      const res = await fetch("/api/admin/home-covers", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cover),
      })
      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      setCovers((prev) => prev.map((c) => (c.id === cover.id ? saved : c)))
    } catch (e) {
      alert("Kaydedilemedi: " + (e as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  const remove = async (cover: Cover) => {
    if (cover.id.startsWith("new-")) {
      setCovers((prev) => prev.filter((c) => c.id !== cover.id))
      return
    }
    if (!confirm("Bu kapak silinsin mi?")) return
    setSavingId(cover.id)
    try {
      const res = await fetch(`/api/admin/home-covers?id=${cover.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      setCovers((prev) => prev.filter((c) => c.id !== cover.id))
    } catch (e) {
      alert("Silinemedi: " + (e as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Hero (üst banner) slaytları. Hiç aktif kapak yoksa öne çıkan kurs görselleri gösterilir.
        </p>
        <button
          onClick={addNew}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="h-4 w-4" /> Yeni Kapak
        </button>
      </div>

      {covers.length === 0 && (
        <div className="text-center text-gray-500 py-12 border border-dashed border-gray-800 rounded-xl">
          Henüz kapak eklenmemiş.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {covers.map((cover) => (
          <div key={cover.id} className="bg-neutral-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
            <ImageUpload
              currentImageUrl={cover.imageUrl || undefined}
              type="home-cover"
              onImageUploaded={(url) => update(cover.id, "imageUrl", url)}
            />
            <div>
              <label className={labelCls}>Başlık</label>
              <input
                className={inputCls}
                value={cover.title || ""}
                onChange={(e) => update(cover.id, "title", e.target.value)}
                placeholder="Örn: Yeni Sezon Kursları"
              />
            </div>
            <div>
              <label className={labelCls}>Alt Başlık</label>
              <input
                className={inputCls}
                value={cover.subtitle || ""}
                onChange={(e) => update(cover.id, "subtitle", e.target.value)}
                placeholder="Kısa açıklama (opsiyonel)"
              />
            </div>
            <div>
              <label className={labelCls}>Bağlantı (buton hedefi)</label>
              <input
                className={inputCls}
                value={cover.linkUrl || ""}
                onChange={(e) => update(cover.id, "linkUrl", e.target.value)}
                placeholder="/course/... veya /subscription (opsiyonel)"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24">
                <label className={labelCls}>Sıra</label>
                <input
                  type="number"
                  className={inputCls}
                  value={cover.order}
                  onChange={(e) => update(cover.id, "order", parseInt(e.target.value) || 0)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cover.isActive}
                  onChange={(e) => update(cover.id, "isActive", e.target.checked)}
                  className="w-4 h-4 accent-orange-600"
                />
                Aktif
              </label>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
              <button
                onClick={() => save(cover)}
                disabled={savingId === cover.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg"
              >
                {savingId === cover.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Kaydet
              </button>
              <button
                onClick={() => remove(cover)}
                disabled={savingId === cover.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 text-sm rounded-lg"
              >
                <Trash2 className="h-4 w-4" /> Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ========================= EĞİTMENLER =========================
function InstructorsTab({ initial }: { initial: HInstructor[] }) {
  const [items, setItems] = useState<HInstructor[]>(initial)
  const [savingId, setSavingId] = useState<string | null>(null)

  const addNew = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: "",
        subtitle: "",
        imageUrl: "",
        linkUrl: "",
        order: prev.length,
        isActive: true,
        email: "",
        password: "",
      },
    ])
  }

  const update = (id: string, field: keyof HInstructor, value: unknown) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const save = async (item: HInstructor) => {
    const isNew = item.id.startsWith("new-")
    if (!item.name.trim()) {
      alert("Eğitmen adı zorunludur.")
      return
    }
    if (isNew) {
      if (!item.email || !item.email.trim()) {
        alert("E-posta zorunludur.")
        return
      }
      if (!item.password || item.password.length < 6) {
        alert("Şifre en az 6 karakter olmalıdır.")
        return
      }
    }
    setSavingId(item.id)
    try {
      const res = await fetch("/api/admin/home-instructors", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      setItems((prev) => prev.map((c) => (c.id === item.id ? saved : c)))
    } catch (e) {
      alert("Kaydedilemedi: " + (e as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  const remove = async (item: HInstructor) => {
    if (item.id.startsWith("new-")) {
      setItems((prev) => prev.filter((c) => c.id !== item.id))
      return
    }
    if (!confirm("Bu eğitmen silinsin mi?")) return
    setSavingId(item.id)
    try {
      const res = await fetch(`/api/admin/home-instructors?id=${item.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      setItems((prev) => prev.filter((c) => c.id !== item.id))
    } catch (e) {
      alert("Silinemedi: " + (e as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Eklediğin her eğitmen, giriş yapabilen gerçek bir hesap olur (role=INSTRUCTOR).
          Anasayfadaki "Eğitmenlerimiz" satırında girdiğin sırayla, yıldız/puan olmadan listelenir.
        </p>
        <button
          onClick={addNew}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="h-4 w-4" /> Yeni Eğitmen
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center text-gray-500 py-12 border border-dashed border-gray-800 rounded-xl">
          Henüz eğitmen eklenmemiş.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-neutral-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
            <ImageUpload
              currentImageUrl={item.imageUrl || undefined}
              type="home-instructor"
              onImageUploaded={(url) => update(item.id, "imageUrl", url)}
            />
            <div>
              <label className={labelCls}>İsim *</label>
              <input
                className={inputCls}
                value={item.name}
                onChange={(e) => update(item.id, "name", e.target.value)}
                placeholder="Örn: Şef Kemal Can"
              />
            </div>

            {/* Gerçek hesap: e-posta + şifre */}
            {item.id.startsWith("new-") ? (
              <>
                <div>
                  <label className={labelCls}>E-posta * (giriş için)</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={item.email || ""}
                    onChange={(e) => update(item.id, "email", e.target.value)}
                    placeholder="egitmen@ornek.com"
                  />
                </div>
                <div>
                  <label className={labelCls}>Şifre * (en az 6 karakter)</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={item.password || ""}
                    onChange={(e) => update(item.id, "password", e.target.value)}
                    placeholder="Eğitmen sonra kendisi değiştirebilir"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={labelCls}>E-posta (giriş)</label>
                  <input
                    className={`${inputCls} opacity-60 cursor-not-allowed`}
                    value={item.email || "—"}
                    readOnly
                  />
                </div>
                <div>
                  <label className={labelCls}>Yeni Şifre (opsiyonel — sıfırlamak için)</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={item.password || ""}
                    onChange={(e) => update(item.id, "password", e.target.value)}
                    placeholder="Boş bırak = değişmez"
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Alt Yazı</label>
              <input
                className={inputCls}
                value={item.subtitle || ""}
                onChange={(e) => update(item.id, "subtitle", e.target.value)}
                placeholder="Örn: Michelin Yıldızlı Şef (opsiyonel)"
              />
            </div>
            <div>
              <label className={labelCls}>Bağlantı</label>
              <input
                className={inputCls}
                value={item.linkUrl || ""}
                onChange={(e) => update(item.id, "linkUrl", e.target.value)}
                placeholder="/instructor/... (opsiyonel)"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24">
                <label className={labelCls}>Sıra</label>
                <input
                  type="number"
                  className={inputCls}
                  value={item.order}
                  onChange={(e) => update(item.id, "order", parseInt(e.target.value) || 0)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isActive}
                  onChange={(e) => update(item.id, "isActive", e.target.checked)}
                  className="w-4 h-4 accent-orange-600"
                />
                Aktif
              </label>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
              <button
                onClick={() => save(item)}
                disabled={savingId === item.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg"
              >
                {savingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Kaydet
              </button>
              <button
                onClick={() => remove(item)}
                disabled={savingId === item.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 text-sm rounded-lg"
              >
                <Trash2 className="h-4 w-4" /> Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ========================= BÖLÜM SIRASI =========================
function SectionsTab({ initial }: { initial: Section[] }) {
  const [sections, setSections] = useState<Section[]>(
    [...initial].sort((a, b) => a.order - b.order)
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSections(next.map((s, i) => ({ ...s, order: i })))
    setSaved(false)
  }

  const toggle = (key: string) => {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, isVisible: !s.isVisible } : s)))
    setSaved(false)
  }

  const saveAll = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const payload = sections.map((s, i) => ({
        key: s.key,
        label: s.label,
        order: i,
        isVisible: s.isVisible,
      }))
      const res = await fetch("/api/admin/home-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: payload }),
      })
      if (!res.ok) throw new Error(await res.text())
      const fresh = await res.json()
      setSections([...fresh].sort((a: Section, b: Section) => a.order - b.order))
      setSaved(true)
    } catch (e) {
      alert("Kaydedilemedi: " + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-gray-500">
        Anasayfa bölümlerinin sırasını değiştirin veya gizleyin. (Üst banner sabittir.)
      </p>

      <div className="space-y-2">
        {sections.map((s, index) => (
          <div
            key={s.key}
            className={`flex items-center justify-between gap-3 bg-neutral-900/40 border border-gray-800 rounded-xl px-4 py-3 ${
              !s.isVisible ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-sm font-mono w-6">{index + 1}</span>
              <span className="text-white font-medium">{s.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggle(s.key)}
                title={s.isVisible ? "Gizle" : "Göster"}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                {s.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === sections.length - 1}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Sırayı Kaydet
        </button>
        {saved && <span className="text-green-400 text-sm">Kaydedildi ✓</span>}
      </div>
    </div>
  )
}
