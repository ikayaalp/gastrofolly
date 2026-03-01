"use client"

import { useFavorites } from '@/contexts/FavoritesContext'
import { useSession } from 'next-auth/react'
import { ChefHat, Heart, Trash2, Home, BookOpen, MessageCircle, Search, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import UserDropdown from '@/components/ui/UserDropdown'

export default function FavoritesPage() {
  const { state, removeFavorite, clearFavorites } = useFavorites()
  const { data: session } = useSession()

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-black">
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
                <nav className="flex space-x-6">
                  <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                    Ana Sayfa
                  </Link>
                  <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                    Kurslarım
                  </Link>
                  {session?.user?.role === 'ADMIN' && (
                    <>
                      <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                        Admin Paneli
                      </Link>
                      <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                        Kurs Yönetimi
                      </Link>
                    </>
                  )}
                  <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">
                    Culi
                  </Link>
                  <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                    Chef Sosyal
                  </Link>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                    İletişim
                  </Link>
                </nav>
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

        {/* Empty Favorites */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
          <div className="text-center">
            <Heart className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Favorileriniz Boş</h1>
            <p className="text-gray-400 mb-8">Henüz favori kurs eklemediniz.</p>
            <Link
              href="/home"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Kursları Keşfet
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
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
              <nav className="flex space-x-6">
                <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
                <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurslarım
                </Link>
                {session?.user?.role === 'ADMIN' && (
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
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  İletişim
                </Link>
              </nav>
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
            <button className="p-2 text-gray-300 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <UserDropdown />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 md:pt-24 pb-20 md:pb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Listem</h1>
          <button
            onClick={clearFavorites}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Tümünü Temizle
          </button>
        </div>

        <div className="flex flex-wrap gap-6">
          {state.items.map((course) => (
            <div key={course.id} className="relative">
              {/* Remove button */}
              <button
                onClick={() => removeFavorite(course.id)}
                className="absolute top-2 right-2 z-40 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors shadow-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {/* Course Card - simplified version matching home page style */}
              <Link
                href={`/course/${course.id}`}
                className="block relative bg-black border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 group cursor-pointer min-w-[320px] w-[320px] h-[256px] flex-shrink-0"
              >
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
                    <ChefHat className="h-16 w-16 text-orange-500" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                {/* Course Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-orange-500 transition-colors overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    lineHeight: '1.3',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}>
                    {course.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    {/* Instructor */}
                    <div className="flex items-center overflow-hidden">
                      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {course.instructor.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <span className="text-xs text-white/90 truncate" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                        {course.instructor.name || "Bilinmeyen Eğitmen"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

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
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef&apos;e Sor</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
