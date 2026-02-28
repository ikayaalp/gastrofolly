'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChefHat,
  Mail,
  BookOpen,
  User,
  Loader2,
  Home,
  Users,
  MessageCircle,
  GraduationCap,
  Copy,
  Check
} from 'lucide-react'
import UserDropdown from '@/components/ui/UserDropdown'

interface Course {
  id: string
  title: string
  imageUrl: string | null
}

interface Instructor {
  id: string
  name: string | null
  email: string
  image: string | null
  courses: Course[]
}

interface Session {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

interface Props {
  session: Session | null
}

export default function ChefSorClient({ session }: Props) {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchInstructors()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchInstructors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chef-sor/instructors')

      if (!response.ok) {
        throw new Error('Failed to fetch instructors')
      }

      const data = await response.json()
      setInstructors(data.instructors || [])
    } catch (err) {
      console.error('Error fetching instructors:', err)
      setError('Hocalar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailClick = (email: string, name: string | null) => {
    const subject = encodeURIComponent('Kurs Hakkında Soru')
    const body = encodeURIComponent(`Merhaba ${name || 'Hocam'},\n\n`)
    // Gmail compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}&body=${body}`
    window.open(gmailUrl, '_blank')
  }

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2000)
    } catch (err) {
      console.error('Failed to copy email:', err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center gap-0.5">
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
                {session?.user?.role === 'ADMIN' && (
                  <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                )}
              </Link>
              {session?.user && (
                <nav className="hidden md:flex space-x-6">
                  <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                    Ana Sayfa
                  </Link>
                  <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                    Kurslarım
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <>
                      <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                        Admin Paneli
                      </Link>
                      <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                        Kurs Yönetimi
                      </Link>
                    </>
                  )}
                  <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                    Chef Sosyal
                  </Link>
                  <Link href="/chef-sor" className="text-white font-semibold">
                    Chef&apos;e Sor
                  </Link>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                    İletişim
                  </Link>
                </nav>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {session?.user ? (
                <UserDropdown />
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-orange-500"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center gap-0.5">
            <div className="relative w-8 h-8">

              <Image

                src="/logo.jpeg"

                alt="C"

                fill

                className="object-contain"

              />

            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-orange-500">ulin</span>
              <span className="text-white">ora</span>
            </span>
          </Link>
          <div className="flex items-center space-x-3">
            {session?.user ? (
              <UserDropdown />
            ) : (
              <Link
                href="/auth/signin"
                className="text-gray-300 hover:text-orange-500 text-sm"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-20 md:pt-24 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-500/20 p-3 rounded-xl">
                <GraduationCap className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Chef&apos;e Sor</h1>
                <p className="text-gray-400">Kurs hocalarınıza doğrudan ulaşın</p>
              </div>
            </div>
          </div>

          {/* Content */}
          {!session?.user ? (
            <div className="text-center py-16">
              <div className="bg-gray-900 rounded-xl p-12 border border-gray-800">
                <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Giriş Yapmalısınız</h2>
                <p className="text-gray-400 mb-6">
                  Hocalarınızı görmek için giriş yapmanız gerekiyor
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                >
                  Giriş Yap
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8">
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          ) : instructors.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-900 rounded-xl p-12 border border-gray-800">
                <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Henüz Kurs Kaydınız Yok</h2>
                <p className="text-gray-400 mb-6">
                  Hocalarınızı görebilmek için en az bir kursa kayıt olmalısınız
                </p>
                <Link
                  href="/home"
                  className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                >
                  Kursları Keşfet
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((instructor) => (
                <div
                  key={instructor.id}
                  className="bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20"
                >
                  {/* Instructor Header */}
                  <div className="p-6 border-b border-gray-800">
                    <div className="flex items-start space-x-4 mb-4">
                      {/* Avatar - Fixed Size Container - Clickable */}
                      <Link href={`/instructor/${instructor.id}`} className="flex-shrink-0 w-20 h-20 hover:opacity-80 transition-opacity">
                        {instructor.image ? (
                          <Image
                            src={instructor.image}
                            alt={instructor.name || 'Instructor'}
                            width={80}
                            height={80}
                            className="w-full h-full rounded-full border-2 border-orange-500 object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center border-2 border-orange-500">
                            <User className="h-10 w-10 text-white" />
                          </div>
                        )}
                      </Link>

                      {/* Instructor Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/instructor/${instructor.id}`} className="hover:text-orange-400 transition-colors">
                          <h3 className="text-xl font-bold text-white mb-1 truncate hover:text-orange-400">
                            {instructor.name || 'İsimsiz Eğitmen'}
                          </h3>
                        </Link>

                        {/* Copyable Email */}
                        <button
                          onClick={() => copyEmail(instructor.email)}
                          className="group flex items-center space-x-2 text-sm text-gray-400 hover:text-orange-400 transition-colors mb-2"
                          title={copiedEmail === instructor.email ? 'Kopyalandı!' : 'Kopyala'}
                        >
                          <span className="truncate">{instructor.email}</span>
                          {copiedEmail === instructor.email ? (
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          )}
                        </button>

                        <div className="flex items-center text-xs text-orange-500">
                          <BookOpen className="h-3 w-3 mr-1" />
                          <span>{instructor.courses.length} Kurs</span>
                        </div>
                      </div>
                    </div>

                    {/* Gmail Button */}
                    <button
                      onClick={() => handleEmailClick(instructor.email, instructor.name)}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-orange-500/50"
                    >
                      <Mail className="h-5 w-5" />
                      <span>Gmail&apos;de Gönder</span>
                    </button>
                  </div>

                  {/* Courses List */}
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      Verdiği Kurslar
                    </h4>
                    <div className="space-y-2">
                      {instructor.courses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/learn/${course.id}`}
                          className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700 hover:border-orange-500/30"
                        >
                          <div className="flex items-center space-x-3">
                            {/* Course Image - Fixed Size Container */}
                            <div className="flex-shrink-0 w-10 h-10">
                              {course.imageUrl ? (
                                <Image
                                  src={course.imageUrl}
                                  alt={course.title}
                                  width={40}
                                  height={40}
                                  className="w-full h-full rounded object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-white truncate flex-1">{course.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Sosyal</span>
          </Link>
          <Link href="/chef-sor" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef&apos;e Sor</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
