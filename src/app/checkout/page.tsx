"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { ChefHat, CreditCard, Lock, ArrowLeft, Home, BookOpen, Users, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { state } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  if (state.items.length === 0) {
    router.push('/cart')
    return null
  }

  const totalWithTax = state.total * 1.18

  const handleCheckout = async () => {
    setIsProcessing(true)

    try {
      // Create checkout session with Stripe
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: state.items,
          total: totalWithTax,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        alert(data.error || 'Ödeme işlemi başlatılamadı.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsProcessing(false)
    }
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="space-y-6">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Ödeme Yöntemi
                  </label>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center">
                    <CreditCard className="h-6 w-6 text-orange-500 mr-3" />
                    <div>
                      <p className="text-white font-semibold">Kredi/Banka Kartı</p>
                      <p className="text-gray-400 text-sm">Stripe ile güvenli ödeme</p>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-green-400 font-semibold text-sm">Güvenli Ödeme</p>
                      <p className="text-gray-400 text-xs">
                        Bilgileriniz SSL ile şifrelenir ve güvenle işlenir
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      İşleniyor...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      ₺{totalWithTax.toLocaleString('tr-TR')} Öde
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Ödeme işlemi Stripe üzerinden güvenle gerçekleştirilir
                </p>
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
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">İletişim</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
