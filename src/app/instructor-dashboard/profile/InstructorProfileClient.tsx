"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  ChefHat, 
  Home, 
  BookOpen, 
  Users, 
  MessageSquare,
  Settings,
  User,
  Mail,
  Camera,
  Save,
  ArrowLeft,
  Edit,
  Star,
  TrendingUp,
  Award,
  Clock,
  DollarSign
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string | null
  isPublished: boolean
  createdAt: Date
  _count: {
    enrollments: number
    lessons: number
    reviews: number
  }
}

interface InstructorData {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  createdAt: Date
  courses: Course[]
  _count: {
    courses: number
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
  instructorData: InstructorData
  session: Session
}

export default function InstructorProfileClient({ instructorData, session }: Props) {
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: instructorData.name || "",
    email: instructorData.email,
    image: instructorData.image || ""
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(instructorData.image)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const totalStudents = instructorData.courses.reduce((acc, course) => acc + course._count.enrollments, 0)
  const totalRevenue = instructorData.courses.reduce((acc, course) => acc + (course.price * course._count.enrollments), 0)
  const averageRating = instructorData.courses.reduce((acc, course) => {
    // Burada gerçek rating hesaplaması yapılabilir
    return acc + 4.5 // Varsayılan değer
  }, 0) / instructorData.courses.length

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage("Lütfen sadece resim dosyası seçin")
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Dosya boyutu 5MB'dan küçük olmalıdır")
        return
      }

      setSelectedFile(file)
      
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setMessage("")
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append('name', profileData.name)
      formData.append('email', profileData.email)
      
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        body: formData,
      })

      if (response.ok) {
        setMessage("Profil başarıyla güncellendi!")
        setIsEditing(false)
        setSelectedFile(null)
      } else {
        const error = await response.json()
        setMessage(error.error || 'Profil güncellenemedi')
      }
    } catch (error) {
      setMessage('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="relative w-10 h-10">

                  <Image

                    src="/logo.jpeg"

                    alt="C"

                    fill

                    className="object-contain"

                  />

                </div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-orange-500">ulin</span>
                  <span className="text-white">ora</span>
                </span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <User className="h-6 w-6 text-orange-500" />
                <h1 className="text-xl font-bold text-white">Eğitmen Profili</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/instructor-dashboard"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Geri Dön</span>
              </Link>
              <Link
                href="/instructor-dashboard"
                className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all flex items-center space-x-2 shadow-lg"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center ring-4 ring-gray-700">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={profileData.name || 'Eğitmen'}
                    width={128}
                    height={128}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-white" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => document.getElementById('profile-image')?.click()}
                  className="absolute bottom-0 right-0 bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 transition-colors shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profileData.name || 'Eğitmen'}
                  </h1>
                  <p className="text-gray-400 text-lg mb-4">{profileData.email}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <span className="flex items-center space-x-1">
                      <Award className="h-4 w-4 text-orange-500" />
                      <span>Eğitmen</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>{new Date(instructorData.createdAt).toLocaleDateString('tr-TR')} tarihinde katıldı</span>
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all flex items-center space-x-2 shadow-lg"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Profili Düzenle</span>
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setProfileData({
                            name: instructorData.name || "",
                            email: instructorData.email,
                            image: instructorData.image || ""
                          })
                          setPreviewUrl(instructorData.image)
                          setSelectedFile(null)
                          setMessage("")
                        }}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleProfileSubmit}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition-all flex items-center space-x-2 shadow-lg disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam Kurs</p>
                <p className="text-2xl font-bold text-white">{instructorData._count.courses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-white">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam Gelir</p>
                <p className="text-2xl font-bold text-white">₺{totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ortalama Puan</p>
                <p className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="border-b border-gray-800">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profil Bilgileri', icon: User },
                { id: 'courses', label: 'Kurslarım', icon: BookOpen },
                { id: 'analytics', label: 'İstatistikler', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
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
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-6">Profil Bilgileri</h2>
                
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.includes('başarıyla') ? 'bg-green-600/20 text-green-400 border border-green-600' : 'bg-red-600/20 text-red-400 border border-red-600'
                  }`}>
                    {message}
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Ad Soyad
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          placeholder="Adınızı ve soyadınızı girin"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          E-posta
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          placeholder="E-posta adresinizi girin"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profil Fotoğrafı
                      </label>
                      <input
                        type="file"
                        id="profile-image"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="profile-image"
                        className="inline-flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Fotoğraf Seç</span>
                      </label>
                      <p className="text-gray-400 text-sm mt-2">JPG, PNG formatları desteklenir (Max 5MB)</p>
                      {selectedFile && (
                        <p className="text-green-400 text-sm mt-1">
                          Seçilen dosya: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ad Soyad
                      </label>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white">
                        {profileData.name || 'Belirtilmemiş'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        E-posta
                      </label>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white">
                        {profileData.email}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Kurslarım</h2>
                  <Link
                    href="/instructor-dashboard/courses"
                    className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all flex items-center space-x-2 shadow-lg"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Kursları Yönet</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instructorData.courses.map((course) => (
                    <div key={course.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-white font-semibold text-lg">{course.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          course.isPublished ? 'bg-green-600/20 text-green-400 border border-green-600' : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600'
                        }`}>
                          {course.isPublished ? 'Yayında' : 'Taslak'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{course._count.enrollments} öğrenci</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{course._count.lessons} ders</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>{course._count.reviews} değerlendirme</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-500 font-semibold">₺{course.price}</span>
                        <Link
                          href={`/instructor-dashboard/courses/${course.id}`}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                          Düzenle
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">İstatistikler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <span>Kurs İstatistikleri</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Kurs:</span>
                        <span className="text-white font-medium">{instructorData._count.courses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Yayında:</span>
                        <span className="text-green-400 font-medium">
                          {instructorData.courses.filter(c => c.isPublished).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Taslak:</span>
                        <span className="text-yellow-400 font-medium">
                          {instructorData.courses.filter(c => !c.isPublished).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span>Öğrenci İstatistikleri</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Öğrenci:</span>
                        <span className="text-white font-medium">{totalStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ortalama Puan:</span>
                        <span className="text-yellow-400 font-medium">{averageRating.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Gelir:</span>
                        <span className="text-green-400 font-medium">₺{totalRevenue.toLocaleString()}</span>
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
