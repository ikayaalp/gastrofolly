'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Settings, BookOpen, LogOut, ChevronDown, Play, Heart, Award } from 'lucide-react'

export default function UserDropdown() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!session?.user) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center border-2 border-gray-600 hover:border-orange-500 transition-colors overflow-hidden relative">
          {session.user.image && !imageError ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User'}
              fill
              sizes="32px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-sm font-bold text-white tracking-wider">
              {getInitials(session.user.name)}
            </span>
          )}
        </div>
        <span className="hidden md:block text-sm font-medium">
          {session.user.name}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-xl z-50">
          {/* Kullanıcı Bilgileri */}
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center overflow-hidden relative">
                {session.user.image && !imageError ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white tracking-wider">
                    {getInitials(session.user.name)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">
                  {session.user.name || 'Kullanıcı'}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {session.user.email}
                </p>
                <p className="text-orange-500 text-xs font-medium">
                  {session.user.role === 'ADMIN' ? 'Yönetici' :
                    session.user.role === 'INSTRUCTOR' ? 'Eğitmen' : 'Öğrenci'}
                </p>
              </div>
            </div>
          </div>

          {/* Menü Seçenekleri */}
          <div className="py-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              <User className="h-4 w-4 mr-3" />
              Profilim
            </Link>

            <Link
              href="/my-courses"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              <BookOpen className="h-4 w-4 mr-3" />
              Kurslarım
            </Link>

            <Link
              href="/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              <Heart className="h-4 w-4 mr-3" />
              Favorilerim
            </Link>

            <Link
              href="/certificates"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              <Award className="h-4 w-4 mr-3" />
              Sertifikalarım
            </Link>

            {session.user.role === 'ADMIN' && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  <User className="h-4 w-4 mr-3" />
                  Admin Paneli
                </Link>
                <Link
                  href="/admin/courses"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  <Play className="h-4 w-4 mr-3" />
                  Kurs Yönetimi
                </Link>
              </>
            )}

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4 mr-3" />
              Ayarlar
            </Link>
          </div>

          {/* Çıkış */}
          <div className="border-t border-gray-800 py-2">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
