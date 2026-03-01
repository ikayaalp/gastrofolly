"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChefHat, Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      router.push('/auth/signup')
    }
  }, [email, router])

  const handleChange = (index: number, value: string) => {
    // Sadece rakam kabul et
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Otomatik olarak bir sonraki input'a geç
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace ile önceki input'a dön
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '')

    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const verificationCode = code.join('')
    if (verificationCode.length !== 6) {
      setError('Lütfen 6 haneli kodu giriniz')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/signin?message=Email doğrulandı! Giriş yapabilirsiniz.')
        }, 2000)
      } else {
        setError(data.error || 'Doğrulama başarısız oldu')
      }
    } catch (error) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setError('') // Clear errors
        // Show success message
        alert('Yeni doğrulama kodu gönderildi!')
      } else {
        setError(data.error || 'Kod gönderilemedi')
      }
    } catch (error) {
      setError('Bir hata oluştu')
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full space-y-8 relative">
        <div>
          <div className="flex justify-center">
            <div className="bg-orange-500/20 p-4 rounded-full">
              <Mail className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Email Adresinizi Doğrulayın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            <span className="font-medium text-orange-500">{email}</span> adresine gönderilen 6 haneli kodu giriniz
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
              <div className="bg-green-900/50 border border-green-700 text-green-400 px-4 py-3 rounded-md flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Email başarıyla doğrulandı!</p>
                  <p className="text-sm">Giriş sayfasına yönlendiriliyorsunuz...</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                Doğrulama Kodu
              </label>
              <div className="flex justify-center space-x-2 sm:space-x-3">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-gray-800/80 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 transition-all"
                    disabled={isLoading || success}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                Kodu kopyala-yapıştır yapabilirsiniz
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || success || code.join('').length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Doğrulanıyor...' : success ? 'Doğrulandı ✓' : 'Doğrula'}
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-400">Kod gelmedi mi?</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || success}
                className="text-sm text-orange-500 hover:text-orange-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Yeni Kod Gönder</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400">
                Kod 10 dakika süreyle geçerlidir
              </p>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/signup"
              className="text-sm text-gray-400 hover:text-white"
            >
              ← Kayıt sayfasına dön
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="flex items-center justify-center gap-0.5">
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
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  )
}

