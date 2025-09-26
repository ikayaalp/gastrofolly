"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  Save, 
  Eye, 
  Upload, 
  X, 
  Plus,
  BookOpen,
  DollarSign,
  Tag,
  FileText,
  Image as ImageIcon,
  Play,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings,
  Users,
  Star,
  MessageSquare
} from "lucide-react"

interface Category {
  id: string
  name: string
}

interface Lesson {
  id: string
  title: string
  description: string
  order: number
  duration: number
  videoUrl?: string
  isPublished: boolean
  createdAt: Date
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface Course {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string | null
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  category: Category
  instructor: {
    id: string
    name: string
    email: string
  }
  lessons: Lesson[]
  reviews: Review[]
  _count: {
    enrollments: number
    lessons: number
  }
}

interface Session {
  user: {
    id: string
    name?: string | null | undefined
    email?: string | null | undefined
    image?: string | null | undefined
    role?: string | undefined
  }
}

interface Props {
  course: Course
  categories: Category[]
  session: Session
}

export default function CourseEditClient({ course, categories, session }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [previewImage, setPreviewImage] = useState<string | null>(course.imageUrl || null)
  
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description,
    price: course.price.toString(),
    categoryId: course.category.id,
    imageUrl: course.imageUrl || "",
    isPublished: course.isPublished
  })

  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    duration: "",
    videoUrl: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image-cloud', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
        setPreviewImage(data.url)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/instructor/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating course:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLesson.title || !newLesson.description) return

    try {
      const response = await fetch('/api/instructor/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLesson,
          courseId: course.id,
          duration: parseInt(newLesson.duration)
        }),
      })

      if (response.ok) {
        setNewLesson({ title: "", description: "", duration: "", videoUrl: "" })
        window.location.reload()
      }
    } catch (error) {
      console.error('Error adding lesson:', error)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Bu dersi silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/instructor/lessons/${lessonId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
    }
  }

  const averageRating = course.reviews.length > 0 
    ? course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length 
    : 0

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Kurs Düzenle</h1>
              <p className="text-gray-400">{course.title}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/course/${course.id}`}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Önizle</span>
              </Link>
              <Link
                href="/instructor-dashboard/courses"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Geri Dön
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Öğrenci</p>
                <p className="text-2xl font-bold text-white">{course._count.enrollments}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ders</p>
                <p className="text-2xl font-bold text-white">{course._count.lessons}</p>
              </div>
              <Play className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Puan</p>
                <p className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Durum</p>
                <p className={`text-2xl font-bold ${course.isPublished ? 'text-green-500' : 'text-yellow-500'}`}>
                  {course.isPublished ? 'Yayında' : 'Taslak'}
                </p>
              </div>
              <Settings className="h-8 w-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'basic', label: 'Temel Bilgiler', icon: BookOpen },
                { id: 'lessons', label: 'Dersler', icon: Play },
                { id: 'reviews', label: 'Yorumlar', icon: Star },
                { id: 'analytics', label: 'Analitik', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Course Image */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5" />
                    <span>Kurs Görseli</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {previewImage ? (
                      <div className="relative">
                        <Image
                          src={previewImage}
                          alt="Course preview"
                          width={400}
                          height={200}
                          className="rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null)
                            setFormData(prev => ({ ...prev, imageUrl: "" }))
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Kurs görseli yükleyin</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors cursor-pointer inline-block"
                        >
                          Görsel Seç
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                      Kurs Başlığı *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                      Kurs Açıklaması *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-2">
                      Kategori *
                    </label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                      Fiyat (₺) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="isPublished"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <label htmlFor="isPublished" className="text-gray-300">
                        Kursu yayınla
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Değişiklikleri Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Lessons Tab */}
            {activeTab === 'lessons' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Dersler ({course.lessons.length})</h3>
                  <button
                    onClick={() => document.getElementById('new-lesson-form')?.scrollIntoView()}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Yeni Ders</span>
                  </button>
                </div>

                {/* Lessons List */}
                <div className="space-y-4">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="bg-orange-600 text-white text-sm font-medium px-2 py-1 rounded">
                              {index + 1}
                            </span>
                            <h4 className="text-white font-semibold">{lesson.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs ${
                              lesson.isPublished ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                            }`}>
                              {lesson.isPublished ? 'Yayında' : 'Taslak'}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{lesson.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{lesson.duration} dakika</span>
                            {lesson.videoUrl && (
                              <span className="text-green-500">Video yüklü</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-orange-500 hover:text-orange-400">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* New Lesson Form */}
                <div id="new-lesson-form" className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                  <h4 className="text-white font-semibold mb-4">Yeni Ders Ekle</h4>
                  <form onSubmit={handleAddLesson} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Ders Başlığı *
                        </label>
                        <input
                          type="text"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Süre (dakika) *
                        </label>
                        <input
                          type="number"
                          value={newLesson.duration}
                          onChange={(e) => setNewLesson(prev => ({ ...prev, duration: e.target.value }))}
                          required
                          min="1"
                          className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Açıklama *
                      </label>
                      <textarea
                        value={newLesson.description}
                        onChange={(e) => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                        required
                        rows={3}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Video URL (opsiyonel)
                      </label>
                      <input
                        type="url"
                        value={newLesson.videoUrl}
                        onChange={(e) => setNewLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Ders Ekle</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-6">Yorumlar ({course.reviews.length})</h3>
                <div className="space-y-4">
                  {course.reviews.map((review) => (
                    <div key={review.id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
                          {review.user.image ? (
                            <Image
                              src={review.user.image}
                              alt={review.user.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-white font-medium">
                              {review.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-white font-semibold">{review.user.name}</h4>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-gray-400 text-sm">
                              {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <p className="text-gray-300">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-6">Kurs Analitikleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">Genel İstatistikler</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Öğrenci:</span>
                        <span className="text-white">{course._count.enrollments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Ders:</span>
                        <span className="text-white">{course._count.lessons}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ortalama Puan:</span>
                        <span className="text-white">{averageRating.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Yorum:</span>
                        <span className="text-white">{course.reviews.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">Kurs Bilgileri</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kategori:</span>
                        <span className="text-white">{course.category.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fiyat:</span>
                        <span className="text-white">₺{course.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Oluşturulma:</span>
                        <span className="text-white">{new Date(course.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Son Güncelleme:</span>
                        <span className="text-white">{new Date(course.updatedAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
