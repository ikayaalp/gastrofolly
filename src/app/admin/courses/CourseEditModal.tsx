"use client"

import { useState, useEffect } from "react"
import { X, Save, Check } from "lucide-react"
import ImageUpload from "@/components/admin/ImageUpload"

interface Course {
  id: string
  title: string
  description: string
  imageUrl: string | null
  level: string
  duration: number | null
  isPublished: boolean
  accessibleByPlans: string[]
  category: {
    name: string
    id: string
  }
  instructor: {
    id: string
    name: string | null
    email: string
  }
}

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
}

interface Instructor {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface CourseEditModalProps {
  course: Course | null // null ise yeni kurs oluşturuluyor
  categories: Category[]
  instructors: Instructor[]
  onClose: () => void
}

const SUBSCRIPTION_PLANS = [
  { id: 'COMMIS', label: 'Commis', color: 'bg-orange-500' },
  { id: 'CHEF_DE_PARTIE', label: 'Chef de Partie', color: 'bg-blue-500' },
  { id: 'EXECUTIVE', label: 'Executive Chef', color: 'bg-purple-500' }
]

export default function CourseEditModal({ course, categories, instructors, onClose }: CourseEditModalProps) {
  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    imageUrl: course?.imageUrl || "",
    level: course?.level || "BEGINNER",
    duration: course?.duration || 0,
    isPublished: course?.isPublished || false,
    categoryId: course?.category?.id || "",
    instructorId: course?.instructor?.id || "",
    accessibleByPlans: course?.accessibleByPlans || [] as string[]
  })
  const [loading, setLoading] = useState(false)

  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }))
  }

  const togglePlanAccess = (planId: string) => {
    setFormData(prev => {
      const currentPlans = prev.accessibleByPlans
      if (currentPlans.includes(planId)) {
        return { ...prev, accessibleByPlans: currentPlans.filter(p => p !== planId) }
      } else {
        return { ...prev, accessibleByPlans: [...currentPlans, planId] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = course
        ? `/api/admin/courses/${course.id}`
        : '/api/admin/courses'

      const method = course ? 'PUT' : 'POST'

      // Fiyat alanları artık veritabanında tutulsa da UI'da yok, default değerler gönderiyoruz
      const payload = {
        ...formData,
        price: 0,
        isFree: false,
        discountRate: 0
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        onClose()
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Kurs kaydedilemedi')
      }
    } catch (error) {
      console.error('Save course error:', error)
      alert('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked
      : type === 'number' ? parseFloat(value) || 0
        : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-neutral-900 border border-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white">
                {course ? 'Kursu Düzenle' : 'Yeni Kurs Oluştur'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Sol Kolon */}
                <div className="space-y-6">
                  {/* Başlık */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kurs Başlığı *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      placeholder="Örn: İtalyan Mutfağı Başlangıç"
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kategori *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors appearance-none"
                    >
                      <option value="">Kategori seçin</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Eğitmen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Eğitmen *
                    </label>
                    <select
                      name="instructorId"
                      value={formData.instructorId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors appearance-none"
                    >
                      <option value="">Eğitmen seçin</option>
                      {instructors.map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name} ({instructor.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seviye */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Zorluk Seviyesi *
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors appearance-none"
                    >
                      <option value="BEGINNER">Kolay (Beginner)</option>
                      <option value="INTERMEDIATE">Orta (Intermediate)</option>
                      <option value="ADVANCED">Zor (Advanced)</option>
                    </select>
                  </div>
                </div>

                {/* Sağ Kolon */}
                <div className="space-y-6">
                  {/* Abonelik Planları */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Erişilebilir Abonelik Planları *
                    </label>
                    <div className="space-y-3 bg-black border border-gray-800 rounded-xl p-4">
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <label
                          key={plan.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${formData.accessibleByPlans.includes(plan.id)
                              ? 'bg-gray-900 border-orange-500/50'
                              : 'bg-transparent border-gray-800 hover:bg-gray-900'
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`w-2 h-2 rounded-full ${plan.color}`}></span>
                            <span className="text-sm font-medium text-white">{plan.label}</span>
                          </div>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.accessibleByPlans.includes(plan.id)
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'border-gray-600'
                            }`}>
                            {formData.accessibleByPlans.includes(plan.id) && <Check className="h-3 w-3" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.accessibleByPlans.includes(plan.id)}
                            onChange={() => togglePlanAccess(plan.id)}
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Bu kursu hangi abonelik seviyesindeki kullanıcılar görebilecek?
                    </p>
                  </div>

                  {/* Erişim Süresi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tahmini Süre (dakika)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                      placeholder="Örn: 120"
                    />
                  </div>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kurs Açıklaması *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Kurs içeriği hakkında detaylı bilgi..."
                />
              </div>

              {/* Resim Yükleme */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kapak Görseli
                </label>
                <div className="bg-black border border-gray-800 rounded-xl p-4">
                  <ImageUpload
                    onImageUploaded={handleImageUploaded}
                    currentImageUrl={formData.imageUrl}
                    type="course"
                  />
                </div>
              </div>

              {/* Yayınlama Checkbox */}
              <div className="flex items-center space-x-3 bg-black border border-gray-800 rounded-xl p-4">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-orange-600 bg-gray-900 border-gray-700 rounded focus:ring-orange-500"
                  id="publish-check"
                />
                <label htmlFor="publish-check" className="cursor-pointer select-none">
                  <span className="block text-sm font-medium text-white">Yayına Al</span>
                  <span className="block text-xs text-gray-500">
                    İşaretlenirse kurs hemen öğrencilerin erişimine açılır.
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end space-x-4 pt-6 mt-8 border-t border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  <span>{course ? 'Değişiklikleri Kaydet' : 'Kursu Oluştur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
