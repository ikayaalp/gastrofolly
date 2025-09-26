"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  MessageSquare, 
  TrendingUp,
  Plus,
  Edit,
  Eye,
  Star,
  BarChart3
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string | null
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    createdAt: Date
    updatedAt: Date
  }
  instructor: {
    id: string
    name: string | null
    email: string
  }
  reviews: Array<{ 
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    courseId: string
    userId: string
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }>
  _count: {
    enrollments: number
    lessons: number
  }
}

interface Message {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  course: {
    id: string
    title: string
    imageUrl: string | null
  }
}

interface InstructorData {
  courses: Course[]
  totalStudents: number
  totalRevenue: number
  recentMessages: Message[]
  courseStats: Array<{
    id: string
    title: string
    _count: {
      enrollments: number
      lessons: number
    }
    reviews: Array<{ rating: number }>
  }>
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

export default function InstructorDashboardClient({ instructorData, session }: Props) {
  const [activeTab, setActiveTab] = useState('overview')

  const averageRating = instructorData.courses.reduce((acc, course) => {
    const courseRating = course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
    return acc + (courseRating || 0)
  }, 0) / instructorData.courses.length

  const totalCourses = instructorData.courses.length
  const publishedCourses = instructorData.courses.filter(c => c.isPublished).length

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      {/* Page Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Eğitmen Paneli</h1>
              <p className="text-gray-400">Hoş geldin, {session.user.name}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/instructor-dashboard/messages"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Mesajlar</span>
              </Link>
              <Link
                href="/instructor-dashboard/courses"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Kurs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam Kurs</p>
                <p className="text-2xl font-bold text-white">{totalCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-white">{instructorData.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam Gelir</p>
                <p className="text-2xl font-bold text-white">₺{instructorData.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
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
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
                { id: 'courses', label: 'Kurslarım', icon: BookOpen },
                { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
                { id: 'analytics', label: 'Analitik', icon: TrendingUp }
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Courses */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Son Kurslar</h3>
                    <div className="space-y-3">
                      {instructorData.courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white font-medium">{course.title}</h4>
                              <p className="text-gray-400 text-sm">{course.category.name}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                <span>{course._count.enrollments} öğrenci</span>
                                <span>{course._count.lessons} ders</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  course.isPublished ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                                }`}>
                                  {course.isPublished ? 'Yayında' : 'Taslak'}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/instructor-dashboard/courses/${course.id}`}
                                className="text-orange-500 hover:text-orange-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/course/${course.id}`}
                                className="text-blue-500 hover:text-blue-400"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Messages */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Son Mesajlar</h3>
                    <div className="space-y-3">
                      {instructorData.recentMessages.map((message) => (
                        <div key={message.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white font-medium">{message.user.name}</h4>
                              <p className="text-gray-400 text-sm">{message.course.title}</p>
                              <p className="text-gray-300 text-sm mt-1 line-clamp-2">{message.content}</p>
                            </div>
                            <span className="text-gray-400 text-xs">
                              {new Date(message.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Kurslarım</h3>
                  <Link
                    href="/instructor-dashboard/courses"
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Yeni Kurs</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instructorData.courses.map((course) => (
                    <div key={course.id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-white font-semibold">{course.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          course.isPublished ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                        }`}>
                          {course.isPublished ? 'Yayında' : 'Taslak'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                        <span>{course._count.enrollments} öğrenci</span>
                        <span>{course._count.lessons} ders</span>
                        <span>₺{course.price}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/instructor-dashboard/courses/${course.id}`}
                          className="flex-1 bg-orange-600 text-white text-center py-2 rounded hover:bg-orange-700 transition-colors"
                        >
                          Düzenle
                        </Link>
                        <Link
                          href={`/course/${course.id}`}
                          className="flex-1 bg-gray-600 text-white text-center py-2 rounded hover:bg-gray-700 transition-colors"
                        >
                          Görüntüle
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Mesajlar</h3>
                  <Link
                    href="/instructor-dashboard/messages"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tümünü Gör
                  </Link>
                </div>
                <div className="space-y-4">
                  {instructorData.recentMessages.map((message) => (
                    <div key={message.id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{message.user.name}</h4>
                          <p className="text-gray-400 text-sm">{message.user.email}</p>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(message.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-3">{message.content}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-500 text-sm font-medium">{message.course.title}</span>
                        <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors text-sm">
                          Yanıtla
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-6">Analitik</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">Kurs İstatistikleri</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Kurs:</span>
                        <span className="text-white">{totalCourses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Yayında:</span>
                        <span className="text-white">{publishedCourses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Taslak:</span>
                        <span className="text-white">{totalCourses - publishedCourses}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">Öğrenci İstatistikleri</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Öğrenci:</span>
                        <span className="text-white">{instructorData.totalStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ortalama Puan:</span>
                        <span className="text-white">{averageRating.toFixed(1)}</span>
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
