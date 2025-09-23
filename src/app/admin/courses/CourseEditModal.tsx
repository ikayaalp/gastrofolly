"use client"

import { useState } from "react"
import { X, Save } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  price: number
  discountRate: number | null
  discountedPrice: number | null
  imageUrl: string | null
  level: string
  duration: number | null
  isPublished: boolean
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

export default function CourseEditModal({ course, categories, instructors, onClose }: CourseEditModalProps) {
  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    price: course?.price || 0,
    discountRate: course?.discountRate || 0,
    discountedPrice: course?.discountedPrice || null,
    imageUrl: course?.imageUrl || "",
    level: course?.level || "BEGINNER",
    duration: course?.duration || 0,
    isPublished: course?.isPublished || false,
    categoryId: course?.category.id || "",
    instructorId: course?.instructor.id || ""
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = course 
        ? `/api/admin/courses/${course.id}` 
        : '/api/admin/courses'
      
      const method = course ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onClose()
        window.location.reload()
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

  // İndirimli fiyat hesaplama
  const calculateDiscountedPrice = (price: number, discountRate: number) => {
    if (discountRate > 0 && discountRate <= 100) {
      return Math.round(price * (1 - discountRate / 100))
    }
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked 
                  : type === 'number' ? parseFloat(value) || 0 
                  : value

    // İndirim oranı değiştiğinde indirimli fiyatı hesapla
    if (name === 'discountRate') {
      const discountRate = parseFloat(value) || 0
      const discountedPrice = calculateDiscountedPrice(formData.price, discountRate)
      setFormData(prev => ({
        ...prev,
        discountRate,
        discountedPrice
      }))
      return
    }

    // Fiyat değiştiğinde indirimli fiyatı yeniden hesapla
    if (name === 'price') {
      const price = parseFloat(value) || 0
      const discountedPrice = calculateDiscountedPrice(price, formData.discountRate)
      setFormData(prev => ({
        ...prev,
        price,
        discountedPrice
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {course ? 'Kursu Düzenle' : 'Yeni Kurs Oluştur'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="Kurs başlığını girin"
                  />
                </div>

                {/* Fiyat */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="299.99"
                  />
                </div>

                {/* İndirim Oranı */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    İndirim Oranı (%)
                  </label>
                  <input
                    type="number"
                    name="discountRate"
                    value={formData.discountRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="20"
                  />
                  {formData.discountRate > 0 && formData.discountedPrice && (
                    <div className="mt-2 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                      <div className="text-sm text-green-300">
                        <div className="flex justify-between items-center">
                          <span>Orijinal Fiyat:</span>
                          <span className="line-through text-gray-400">₺{formData.price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span>İndirimli Fiyat:</span>
                          <span className="text-green-400 font-semibold">₺{formData.discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span>İndirim Tutarı:</span>
                          <span className="text-orange-400">₺{(formData.price - formData.discountedPrice).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
                    Seviye *
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="BEGINNER">Başlangıç</option>
                    <option value="INTERMEDIATE">Orta</option>
                    <option value="ADVANCED">İleri</option>
                  </select>
                </div>

                {/* Süre */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Süre (dakika)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="480"
                  />
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Açıklama *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                  placeholder="Kurs açıklamasını girin..."
                />
              </div>

              {/* Resim URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kurs Resmi URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              {/* Yayın Durumu */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                />
                <label className="text-gray-300">
                  Kursu hemen yayınla
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  <span>{course ? 'Güncelle' : 'Oluştur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
