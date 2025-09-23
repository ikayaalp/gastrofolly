"use client"

import { useCart } from '@/contexts/CartContext'
import { ChefHat, Trash2, ShoppingBag, ArrowLeft, Search, Bell } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import DiscountCode from '@/components/cart/DiscountCode'
import UserDropdown from '@/components/ui/UserDropdown'
import SearchModal from '@/components/ui/SearchModal'
import { useSession } from 'next-auth/react'

export default function CartPage() {
  const { state, removeItem, clearCart } = useCart()
  const router = useRouter()
  const { data: session } = useSession()
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number; amount: number } | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleCheckout = () => {
    if (state.items.length === 0) return
    
    // Redirect to checkout with cart items
    router.push('/checkout')
  }

  const handleDiscountApplied = (discount: { code: string; percentage: number; amount: number }) => {
    setAppliedDiscount(discount)
  }

  const handleDiscountRemoved = () => {
    setAppliedDiscount(null)
  }

  // Fiyat hesaplamaları
  const subtotal = state.total
  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0
  const afterDiscount = subtotal - discountAmount
  const tax = afterDiscount * 0.18
  const finalTotal = afterDiscount + tax

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
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
                <nav className="hidden md:flex space-x-6">
                  <Link href="/home" className="text-white font-semibold">
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
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-300 hover:text-white transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                <UserDropdown />
              </div>
            </div>
          </div>
        </header>

        {/* Empty Cart */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Sepetiniz Boş</h1>
            <p className="text-gray-400 mb-8">Henüz sepetinize ürün eklemediniz.</p>
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
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
              <nav className="hidden md:flex space-x-6">
                <Link href="/home" className="text-white font-semibold">
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
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-300 hover:text-white transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Sepetim</h1>
          <button
            onClick={clearCart}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Sepeti Temizle
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {state.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6"
                >
                  <div className="flex items-start space-x-4">
                    {/* Course Image */}
                    <div className="flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={120}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-30 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                          <ChefHat className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        Eğitmen: {item.instructor.name}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {item.discountedPrice ? (
                            <>
                              <span className="text-xl font-bold text-green-400">
                                ₺{item.discountedPrice.toLocaleString('tr-TR')}
                              </span>
                              <span className="text-gray-400 line-through">
                                ₺{item.price.toLocaleString('tr-TR')}
                              </span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-orange-500">
                              ₺{item.price.toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-6">Sipariş Özeti</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Ürün Sayısı:</span>
                  <span>{state.itemCount}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Ara Toplam:</span>
                  <span>₺{subtotal.toLocaleString('tr-TR')}</span>
                </div>
                
                {appliedDiscount && (
                  <div className="flex justify-between text-green-400">
                    <span>İndirim ({appliedDiscount.code}):</span>
                    <span>-₺{discountAmount.toLocaleString('tr-TR')}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-300">
                  <span>KDV:</span>
                  <span>₺{tax.toLocaleString('tr-TR')}</span>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Toplam:</span>
                    <span>₺{finalTotal.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                {appliedDiscount && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm font-medium">
                      🎉 {appliedDiscount.percentage}% indirim kazandınız!
                    </p>
                    <p className="text-green-300 text-xs">
                      ₺{discountAmount.toLocaleString('tr-TR')} tasarruf
                    </p>
                  </div>
                )}
              </div>

              {/* Discount Code */}
              <DiscountCode
                onDiscountApplied={handleDiscountApplied}
                onDiscountRemoved={handleDiscountRemoved}
                appliedDiscount={appliedDiscount}
                subtotal={subtotal}
              />

              <button
                onClick={handleCheckout}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Satın Al
              </button>
              
              <p className="text-xs text-gray-400 mt-4 text-center">
                Güvenli ödeme ile korunuyorsunuz
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  )
}
