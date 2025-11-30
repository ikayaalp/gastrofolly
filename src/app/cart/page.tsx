"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Crown } from 'lucide-react'
import Link from 'next/link'

export default function CartPage() {
  const router = useRouter()

  useEffect(() => {
    // 2 saniye sonra abonelik sayfasına yönlendir
    const timer = setTimeout(() => {
      router.push('/subscription')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Icon */}
        <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-full p-6 w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <Crown className="h-12 w-12 text-white" />
        </div>

        {/* Message */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Artık Abonelik Sistemi Kullanıyoruz!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Kursları tek tek satın almak yerine, tüm kurslara sınırsız erişim için premium üye olun.
        </p>

        {/* Features */}
        <div className="bg-black border border-gray-800 rounded-xl p-6 mb-8">
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 rounded-full p-1">
                <ChefHat className="h-5 w-5 text-green-400" />
              </div>
              <span className="text-white">Tüm kurslara sınırsız erişim</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 rounded-full p-1">
                <ChefHat className="h-5 w-5 text-green-400" />
              </div>
              <span className="text-white">Yeni içeriklere anında erişim</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 rounded-full p-1">
                <ChefHat className="h-5 w-5 text-green-400" />
              </div>
              <span className="text-white">Sadece 199₺/Taksitli</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/subscription"
          className="inline-block bg-red-600 hover:bg-red-700 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
        >
          Premium Üyeliğe Geç
        </Link>

        <p className="text-gray-400 text-sm mt-4">
          Yönlendiriliyorsunuz...
        </p>
      </div>
    </div>
  )
}
