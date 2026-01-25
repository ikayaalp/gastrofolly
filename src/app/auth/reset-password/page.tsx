"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChefHat, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Check, X } from "lucide-react"
import { validatePassword, getStrengthColor, getStrengthText } from "@/lib/passwordValidator"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  // Şifre validasyonu
  const passwordValidation = validatePassword(formData.password)

  useEffect(() => {
    if (!token || !email) {
      setError("Geçersiz sıfırlama bağlantısı")
    }
  }, [token, email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Şifre validasyonu
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '))
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          newPassword: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/auth/signin?message=Şifreniz değiştirildi! Giriş yapabilirsiniz.")
        }, 2000)
      } else {
        setError(data.message || "Şifre sıfırlanamadı")
      }
    } catch (error) {
      setError("Bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Geçersiz Bağlantı</h2>
          <p className="text-gray-300 mb-6">
            Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
          </p>
          <Link
            href="/auth/forgot-password"
            className="text-orange-500 hover:text-orange-400 font-medium"
          >
            Yeni bağlantı iste →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-orange-500/20 p-4 rounded-full">
              <Lock className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Yeni Şifre Belirle
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            <span className="font-medium text-orange-500">{email}</span> için yeni şifre oluşturun
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-8">
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
                    <p className="font-semibold">Şifre değiştirildi!</p>
                    <p className="text-sm mt-1">Giriş sayfasına yönlendiriliyorsunuz...</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Yeni Şifre
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 pr-10"
                  placeholder="Güçlü bir şifre oluşturun"
                  disabled={success}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Şifre Gücü Göstergesi */}
              {formData.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordValidation.strength === 'strong' ? 'bg-green-500 w-full' :
                          passwordValidation.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                          'bg-red-500 w-1/3'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getStrengthColor(passwordValidation.strength)}`}>
                      {getStrengthText(passwordValidation.strength)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center space-x-1 ${formData.password.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                      {formData.password.length >= 8 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>8+ karakter</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                      {/[A-Z]/.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Büyük harf</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                      {/[a-z]/.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Küçük harf</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/\d/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                      {/\d/.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Rakam</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Özel karakter</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Yeni Şifre (Tekrar)
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Şifrenizi tekrar girin"
                disabled={success}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Değiştiriliyor...' : success ? 'Değiştirildi ✓' : 'Şifreyi Değiştir'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/signin"
                className="text-sm text-gray-400 hover:text-white"
              >
                ← Giriş sayfasına dön
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 text-gray-400 hover:text-white">
            <ChefHat className="h-5 w-5" />
            <span>Culinora&apos;a Dön</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

