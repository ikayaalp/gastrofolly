"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChefHat, Eye, EyeOff, Mail, CheckCircle, Check, X } from "lucide-react"
import { validatePassword, getStrengthColor, getStrengthText } from "@/lib/passwordValidator"

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  
  // Şifre validasyonu
  const passwordValidation = validatePassword(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

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
      // Backend'e kullanıcı bilgilerini kaydet ve doğrulama kodu gönder
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Email doğrulama sayfasına yönlendir
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
        }, 1500)
      } else {
        setError(data.message || "Kayıt olurken bir hata oluştu")
      }
    } catch (error) {
      setError("Bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <ChefHat className="h-12 w-12 text-orange-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Hesap oluşturun
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              Giriş yapın
            </Link>
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-400 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-900/50 border border-green-700 text-green-400 px-4 py-3 rounded-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Hesap başarıyla oluşturuldu!</p>
                    <p className="text-sm mt-1">📧 E-posta adresinize 6 haneli doğrulama kodu gönderildi. Doğrulama sayfasına yönlendiriliyorsunuz...</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                  Ad
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Adınız"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                  Soyad
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Soyadınız"
                />
              </div>
            </div>
            
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
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="ornek@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Şifre
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Güçlü bir şifre oluşturun"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
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
                  
                  {/* Şifre Kriterleri */}
                  <div className="space-y-1">
                    <div className={`flex items-center space-x-2 text-xs ${formData.password.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                      {formData.password.length >= 8 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>En az 8 karakter</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                      {/[A-Z]/.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Büyük harf (A-Z)</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-xs ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                      {/[a-z]/.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Küçük harf (a-z)</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-xs ${/\d/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                      {/\d/.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Rakam (0-9)</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-xs ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-400' : 'text-gray-400'}`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Özel karakter (!@#$%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Şifre Tekrar
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Şifrenizi tekrar girin"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Kaydediliyor..." : "Hesap Oluştur"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
