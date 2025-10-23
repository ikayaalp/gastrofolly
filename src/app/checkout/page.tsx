"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { ChefHat, CreditCard, Lock, ArrowLeft, Home, BookOpen, Users, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

declare global {
  interface Window {
    iyziInit?: () => void
    iyziCheckoutFormResult?: (result: {
      status: string
      conversationId: string
      token?: string
      paymentId?: string
      errorCode?: string
      errorMessage?: string
    }) => void
  }
}

export default function CheckoutPage() {
  const { status } = useSession()
  const router = useRouter()
  const { state, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null)

  const totalWithTax = state.total * 1.18

  useEffect(() => {
    // İyzico callback fonksiyonunu tanımla (Ödeme tamamlandığında çağrılır)
    window.iyziCheckoutFormResult = async (result: {
      status: string
      conversationId?: string
      token?: string
      errorMessage?: string
    }) => {
      console.log('🎯 İyzico Checkout Form Result:', result)
      
      // Ödeme başarılı mı kontrol et
      if (result.status === 'success') {
        console.log('✅ ÖDEME BAŞARILI - Enrollment oluşturuluyor...')
        
        // Backend'e istek at - Pending payment'ları COMPLETED yap + Enrollment oluştur
        try {
          const response = await fetch('/api/iyzico/complete-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: result.conversationId || result.token
            })
          })

          const data = await response.json()

          if (response.ok && data.success) {
            console.log('✅ Enrollment oluşturuldu! Kurslarım sayfasına yönlendiriliyorsunuz...')
            // Sepeti temizle
            clearCart()
            // Başarılı - Kurslarım sayfasına git
            window.location.href = '/my-courses'
          } else {
            console.error('Enrollment oluşturulamadı:', data.error)
            router.push('/cart?error=enrollment_failed')
          }
        } catch (error) {
          console.error('Complete payment error:', error)
          router.push('/cart?error=callback_error')
        }
      } else {
        // Ödeme başarısız - Sepete yönlendir
        console.log('❌ ÖDEME BAŞARISIZ - Sepete yönlendiriliyorsunuz...')
        const errorMsg = result.errorMessage || 'Ödeme başarısız oldu'
        router.push(`/cart?error=${encodeURIComponent(errorMsg)}`)
      }
    }

    // Iyzico form içeriği yüklendiğinde script'leri çalıştır
    if (checkoutFormContent) {
      // Script'leri çalıştır
      const scripts = document.querySelectorAll('#iyzico-checkout-form script')
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script')
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value)
        })
        newScript.appendChild(document.createTextNode(oldScript.innerHTML))
        oldScript.parentNode?.replaceChild(newScript, oldScript)
      })

      // iyziInit fonksiyonunu çağır
      if (typeof window.iyziInit === 'function') {
        window.iyziInit()
      }
    }

    // Cleanup
    return () => {
      delete window.iyziCheckoutFormResult
    }
  }, [checkoutFormContent, router])

  // Session yükleniyor mu kontrol et
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (state.items.length === 0) {
    router.push('/cart')
    return null
  }

  const handleCheckout = async () => {
    setIsProcessing(true)

    try {
      // Iyzico ödeme formu oluştur
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: state.items,
          total: state.total,
        }),
      })

      const data = await response.json()

      if (response.ok && data.checkoutFormContent) {
        // Ödeme formunu göster
        setCheckoutFormContent(data.checkoutFormContent)
      } else {
        alert(data.error || 'Ödeme işlemi başlatılamadı.')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Bir hata oluştu. Lütfen tekrar deneyin.')
      setIsProcessing(false)
    }
  }

      // Eğer ödeme formu gösteriliyorsa
      if (checkoutFormContent) {
        return (
          <div className="min-h-screen bg-black">
            {/* Desktop Header */}
            <header className="hidden md:block bg-gray-900/30 border-b border-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-8">
                    <Link href="/home" className="flex items-center space-x-2">
                      <ChefHat className="h-8 w-8 text-orange-500" />
                      <span className="text-2xl font-bold text-white">Chef2.0</span>
                    </Link>
                  </div>
                  <button
                    onClick={() => setCheckoutFormContent(null)}
                    className="flex items-center text-gray-300 hover:text-orange-500 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Ödeme Bilgilerine Dön
                  </button>
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
                <button
                  onClick={() => setCheckoutFormContent(null)}
                  className="flex items-center text-gray-300 hover:text-orange-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="text-sm">Geri</span>
                </button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Güvenli Ödeme</h1>
                <p className="text-gray-400">iyzico ile güvenli ödeme işleminizi tamamlayın</p>
              </div>

              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <span className="ml-2 text-white text-sm">Ödeme Bilgileri</span>
                  </div>
                  <div className="w-16 h-0.5 bg-orange-500"></div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span className="ml-2 text-white text-sm">Doğrulama</span>
                  </div>
                </div>
              </div>

              {/* Iyzico Checkout Form - Modern Container */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div
                  id="iyzico-checkout-form"
                  dangerouslySetInnerHTML={{ __html: checkoutFormContent }}
                  style={{
                    minHeight: '600px',
                    background: 'transparent'
                  }}
                />
              </div>

              {/* Security Info */}
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
                  <Lock className="h-4 w-4" />
                  <span>256-bit SSL şifreleme ile korunmaktadır</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

  return (
    <div className="min-h-screen bg-black">
      {/* Desktop Header */}
      <header className="hidden md:block bg-gray-900/30 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
              </Link>
            </div>
            <Link
              href="/cart"
              className="flex items-center text-gray-300 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sepete Dön
            </Link>
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
          <Link
            href="/cart"
            className="flex items-center text-gray-300 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm">Sepete Dön</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-8">
        <h1 className="text-3xl font-bold text-white mb-8">Ödeme</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Sipariş Özeti</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={60}
                          height={40}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-15 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                          <ChefHat className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-xs">
                        {item.instructor.name}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.discountedPrice ? (
                        <span className="text-green-400 font-semibold">
                          ₺{item.discountedPrice.toLocaleString('tr-TR')}
                        </span>
                      ) : (
                        <span className="text-orange-500 font-semibold">
                          ₺{item.price.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4 mt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Ara Toplam:</span>
                    <span>₺{state.total.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>KDV (%18):</span>
                    <span>₺{(state.total * 0.18).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-white border-t border-gray-700 pt-2">
                    <span>Toplam:</span>
                    <span>₺{totalWithTax.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Ödeme Bilgileri</h2>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
              <div className="space-y-8">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-white mb-4">
                    Ödeme Yöntemi
                  </label>
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-xl p-6 flex items-center hover:border-orange-500/50 transition-all duration-300">
                    <div className="bg-orange-500 rounded-full p-3 mr-4">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">Kredi/Banka Kartı</p>
                      <p className="text-gray-300 text-sm">iyzico ile güvenli ödeme</p>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="bg-green-500 rounded-full p-2 mr-4">
                      <Lock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-green-400 font-semibold text-lg">Güvenli Ödeme</p>
                      <p className="text-gray-300 text-sm">
                        256-bit SSL şifreleme ile korunmaktadır
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <ChefHat className="h-5 w-5 text-orange-500 mr-2" />
                    Ödeme Özeti
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-300">
                      <span>Kurs Ücreti:</span>
                      <span>₺{state.total.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>KDV (%18):</span>
                      <span>₺{(state.total * 0.18).toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between text-xl font-bold text-white">
                        <span>Toplam:</span>
                        <span className="text-orange-400">₺{totalWithTax.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Ödeme Hazırlanıyor...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="h-6 w-6 mr-3" />
                      ₺{totalWithTax.toLocaleString('tr-TR')} ile Satın Al
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">
                    🎯 Kurslar anında hesabınıza eklenecek
                  </p>
                  <p className="text-xs text-gray-500">
                    Ödeme işlemi iyzico güvencesi altındadır
                  </p>
                </div>
              </div>
            </div>
          </div>
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
          <Link href="/messages" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
