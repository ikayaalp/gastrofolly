"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChefHat, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/search?q=ar")
        const data = await res.json()
        if (mounted && Array.isArray(data?.courses)) {
          const imgs = data.courses
            .map((c: { imageUrl?: string | null }) => c.imageUrl)
            .filter((u: string | null | undefined): u is string => Boolean(u))
          setImages(imgs)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setEmail("")
      } else {
        setError(data.message || "Bir hata oluştu")
      }
    } catch (error) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  const FALLBACK: string[] = [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop",
  ]
  const sources = [...images, ...FALLBACK]
  const tiles = sources.length ? Array.from({ length: 48 }, (_, i) => sources[i % sources.length]) : FALLBACK

  return (
    <div className="relative min-h-screen overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-4 auto-rows-[7rem] sm:auto-rows-[8rem] md:auto-rows-[9rem] lg:auto-rows-[10rem] bg-black">
          {tiles.map((src, i) => (
            <img key={i} src={src} alt="course" className="w-full h-full object-cover rounded-lg opacity-60 hover:opacity-80 transition" loading="lazy" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>
      <div className="max-w-md mx-auto w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-orange-500/20 p-4 rounded-full">
              <Mail className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Şifremi Unuttum
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
          </p>
        </div>

        <div className="backdrop-blur-md bg-black/60 border border-white/10 rounded-xl shadow-2xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-400 px-4 py-3 rounded-md flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-900/50 border border-green-700 text-green-400 px-4 py-3 rounded-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Email gönderildi!</p>
                    <p className="text-sm mt-1">
                      📧 E-posta kutunuzu kontrol edin. Şifre sıfırlama bağlantısı gönderildi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                E-posta adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="ornek@email.com"
                disabled={success}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Gönderiliyor...' : success ? 'Gönderildi ✓' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-400">veya</span>
                </div>
              </div>

              <Link
                href="/auth/signin"
                className="flex items-center justify-center space-x-2 text-orange-500 hover:text-orange-400 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Giriş sayfasına dön</span>
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            Hesabınız yok mu?{" "}
            <Link href="/auth/signup" className="text-orange-500 hover:text-orange-400 font-medium">
              Kayıt olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

