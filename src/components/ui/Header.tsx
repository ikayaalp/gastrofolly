'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ChefHat, Search, Menu, X } from 'lucide-react'
import { useState } from 'react'
import UserDropdown from './UserDropdown'
import SearchModal from './SearchModal'

export default function Header() {
  const { data: session } = useSession()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
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
                {session?.user?.role === 'INSTRUCTOR' && (
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">Eğitmen</span>
                )}
              </Link>
              <nav className="flex space-x-6">
                <Link href="/home" className="text-orange-500 font-medium">
                  Ana Sayfa
                </Link>
                <Link href="/courses" className="text-gray-300 hover:text-orange-500 transition-colors">
                  Kurslar
                </Link>
                <Link href="/chef-sosyal" className="text-gray-300 hover:text-orange-500 transition-colors">
                  Chef Sosyal
                </Link>
                <Link href="/about" className="text-gray-300 hover:text-orange-500 transition-colors">
                  Hakkımızda
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-orange-500 transition-colors">
                  İletişim
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-300 hover:text-orange-500 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              {session?.user ? (
                <UserDropdown />
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-orange-500 transition-colors"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
            {session?.user?.role === 'ADMIN' && (
              <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">Admin</span>
            )}
            {session?.user?.role === 'INSTRUCTOR' && (
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">Eğitmen</span>
            )}
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-300 hover:text-orange-500 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            {session?.user ? (
              <UserDropdown />
            ) : (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-300 hover:text-orange-500 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && !session?.user && (
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-4">
            <div className="flex flex-col space-y-3">
              <Link
                href="/home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-orange-500 font-medium"
              >
                Ana Sayfa
              </Link>
              <Link
                href="/courses"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-300 hover:text-orange-500 transition-colors"
              >
                Kurslar
              </Link>
              <Link
                href="/chef-sosyal"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-300 hover:text-orange-500 transition-colors"
              >
                Chef Sosyal
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-300 hover:text-orange-500 transition-colors"
              >
                Hakkımızda
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-300 hover:text-orange-500 transition-colors"
              >
                İletişim
              </Link>
              <div className="pt-3 border-t border-gray-800 flex flex-col space-y-2">
                <Link
                  href="/auth/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-orange-500 transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-center"
                >
                  Kayıt Ol
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
