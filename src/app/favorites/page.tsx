"use client"

import { useFavorites } from '@/contexts/FavoritesContext'
import { useSession } from 'next-auth/react'
import { ChefHat, Heart, Trash2, Clock, Users, Play, Home, BookOpen, MessageCircle, Search } from 'lucide-react'
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
                <Link href="/home" className="flex items-center space-x-2">
                  <ChefHat className="h-8 w-8 text-orange-500" />
                  <span className="text-2xl font-bold text-white">Chef2.0</span>
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
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
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
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
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
          <h1 className="text-3xl font-bold text-white">Favorilerim</h1>
          <button
            onClick={clearFavorites}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Tümünü Temizle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.items.map((course) => (
            <div
              key={course.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-colors"
            >
              {/* Course Image */}
              <div className="relative">
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                    unoptimized={true}
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <ChefHat className="h-16 w-16 text-white" />
                  </div>
                )}

                {/* Remove from favorites button */}
                <button
                  onClick={() => removeFavorite(course.id)}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Course Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs font-semibold">
                    {course.category.name}
                  </span>
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                    {course.level}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {course.title}
                </h3>

                <div className="flex items-center mb-3">
                  <Image
                    src="/api/placeholder/24/24"
                    alt={course.instructor.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-400">
                    {course.instructor.name}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Play className="h-4 w-4 mr-1" />
                      {course._count.lessons}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course._count.enrollments}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {Math.round(Math.random() * 10 + 5)}h
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {course.discountedPrice ? (
                      <>
                        <span className="text-lg font-bold text-green-400">
                          ₺{course.discountedPrice.toLocaleString('tr-TR')}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          ₺{course.price.toLocaleString('tr-TR')}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-orange-500">
                        ₺{course.price.toLocaleString('tr-TR')}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/course/${course.id}`}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center mt-4"
                >
                  Kursa Git
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
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
