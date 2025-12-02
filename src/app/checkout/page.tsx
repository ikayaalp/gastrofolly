"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { ChefHat, Check, Crown, BookOpen, Zap, Home, Users, MessageCircle, Loader2, Tag, X } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"

function CheckoutContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const planName = searchParams.get("plan")
  const courseId = searchParams.get("courseId")

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: string, value: number, code: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [validatingCode, setValidatingCode] = useState(false)

  // Plan bilgileri
  const plans: Record<string, { price: number, icon: any, color: string }> = {
    "Commis": { price: 199, icon: BookOpen, color: "from-gray-600 to-gray-700" },
    "Chef D party": { price: 399, icon: Crown, color: "from-orange-600 to-red-600" },
    "Executive": { price: 599, icon: Zap, color: "from-purple-600 to-pink-600" }
  }

  const selectedPlan = planName && plans[planName] ? plans[planName] : null

  useEffect(() => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/checkout${planName ? `?plan=${planName}` : ''}${courseId ? `&courseId=${courseId}` : ''}`)
    }
    if (!planName || !selectedPlan) {
      router.push('/subscription')
    }
  }, [session, planName, selectedPlan, router, courseId])

  // Fiyat hesaplamaları
  const basePrice = selectedPlan?.price || 0
  const monthlyPrice = basePrice
  const yearlyPrice = basePrice * 12 * 0.8 // %20 indirim
  const subtotal = billingPeriod === "monthly" ? monthlyPrice : yearlyPrice

  // İndirim hesaplama
  let discountAmount = 0
  if (appliedDiscount) {
    if (appliedDiscount.type === "PERCENTAGE") {
      discountAmount = (subtotal * appliedDiscount.value) / 100
    } else if (appliedDiscount.type === "FIXED") {
      discountAmount = appliedDiscount.value
    }
  }

  const total = Math.max(0, subtotal - discountAmount)

  // İndirim kodu uygula
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Lütfen bir indirim kodu girin")
      return
    }

    setValidatingCode(true)
    try {
      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.toUpperCase() })
      })

      const data = await response.json()

      if (data.valid) {
        setAppliedDiscount(data.discount)
        toast.success("İndirim kodu uygulandı!")
      } else {
        toast.error(data.error || "Geçersiz indirim kodu")
      }
    } catch (error) {
      toast.error("Bir hata oluştu")
    } finally {
      setValidatingCode(false)
    }
  }

  // İndirim kodunu kaldır
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCode("")
    toast.success("İndirim kodu kaldırıldı")
  }

  // Ödemeye devam
  const handleProceedToPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/iyzico/initialize-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          price: total.toString(),
          billingPeriod,
          discountCode: appliedDiscount?.code,
          courseId
        })
      })

      const data = await response.json()

      if (data.success && data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl
      } else {
        toast.error(data.error || "Ödeme başlatılamadı")
        setLoading(false)
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Bir hata oluştu")
      setLoading(false)
    }
  }

  if (!selectedPlan || !planName) {
    return null
  }

  const Icon = selectedPlan.icon

  return (
    <div className="min-h-screen bg-black">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user && <UserDropdown />}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
          </Link>
          <div className="flex items-center space-x-3">
            {session?.user && <UserDropdown />}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 md:pt-24 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Ödeme Bilgileri</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Plan & Billing */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Plan */}
              <div className="bg-black border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Seçili Plan</h2>
                <div className={`bg-gradient-to-br ${selectedPlan.color}/20 border-2 border-gray-700 rounded-xl p-6`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`bg-gradient-to-br ${selectedPlan.color} rounded-full p-3`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{planName}</h3>
                      <p className="text-gray-400">Premium Üyelik</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Period */}
              <div className="bg-black border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Ödeme Dönemi</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`p-4 rounded-xl border-2 transition-all ${billingPeriod === "monthly"
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-gray-700 hover:border-gray-600"
                      }`}
                  >
                    <div className="text-white font-semibold mb-1">Aylık</div>
                    <div className="text-2xl font-bold text-white">{monthlyPrice}₺</div>
                    <div className="text-sm text-gray-400">/ ay</div>
                  </button>

                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={`p-4 rounded-xl border-2 transition-all relative ${billingPeriod === "yearly"
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-gray-700 hover:border-gray-600"
                      }`}
                  >
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      %20 İndirim
                    </div>
                    <div className="text-white font-semibold mb-1">Yıllık</div>
                    <div className="text-2xl font-bold text-white">{Math.round(yearlyPrice)}₺</div>
                    <div className="text-sm text-gray-400">/ yıl</div>
                    <div className="text-xs text-green-400 mt-1">
                      {Math.round(basePrice * 12 - yearlyPrice)}₺ tasarruf
                    </div>
                  </button>
                </div>
              </div>

              {/* Discount Code */}
              <div className="bg-black border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">İndirim Kodu</h2>
                {appliedDiscount ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="text-white font-semibold">{appliedDiscount.code}</div>
                        <div className="text-sm text-green-400">
                          {appliedDiscount.type === "PERCENTAGE"
                            ? `%${appliedDiscount.value} indirim`
                            : `${appliedDiscount.value}₺ indirim`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="İndirim kodunu girin"
                      className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                      disabled={validatingCode}
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={validatingCode || !discountCode.trim()}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {validatingCode ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Kontrol ediliyor...
                        </>
                      ) : (
                        "Uygula"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-black border border-gray-800 rounded-xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Sipariş Özeti</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Ara Toplam</span>
                    <span>{Math.round(subtotal)}₺</span>
                  </div>

                  {billingPeriod === "yearly" && (
                    <div className="flex justify-between text-green-400">
                      <span>Yıllık İndirim (%20)</span>
                      <span>-{Math.round(basePrice * 12 * 0.2)}₺</span>
                    </div>
                  )}

                  {appliedDiscount && (
                    <div className="flex justify-between text-green-400">
                      <span>İndirim Kodu</span>
                      <span>-{Math.round(discountAmount)}₺</span>
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between text-white text-xl font-bold">
                      <span>Toplam</span>
                      <span>{Math.round(total)}₺</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {billingPeriod === "monthly" ? "Aylık" : "Yıllık"} ödeme
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Ödemeye Devam
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Güvenli ödeme Iyzico ile yapılmaktadır
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-black">
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
