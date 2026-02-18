"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { ChefHat, Check, Crown, BookOpen, Home, Users, MessageCircle, Loader2, Tag, X, LucideIcon } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"

function CheckoutContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const planName = searchParams.get("plan")
  const courseId = searchParams.get("courseId")
  const refParam = searchParams.get("ref")

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "6monthly" | "yearly">("monthly")
  const [referralCode, setReferralCode] = useState(refParam || "")
  const [appliedReferral, setAppliedReferral] = useState<{ code: string, discountPercent: number, influencerName: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [validatingCode, setValidatingCode] = useState(false)

  // Plan bilgileri
  const plans: Record<string, { price: number, icon: LucideIcon, color: string }> = {
    "Premium": { price: 5, icon: Crown, color: "from-orange-600 to-red-600" }
  }

  const selectedPlan = planName && plans[planName] ? plans[planName] : null

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push(`/auth/signin?callbackUrl=/checkout${planName ? `?plan=${planName}` : ''}${courseId ? `&courseId=${courseId}` : ''}`)
      return
    }

    const userSubPlan = (session.user as any)?.subscriptionPlan
    const userSubEnd = (session.user as any)?.subscriptionEndDate
    const isSubActive = userSubPlan === "Premium" && (!userSubEnd || new Date(userSubEnd) > new Date())

    if (isSubActive) {
      toast.error("Zaten aktif bir Premium üyeliğiniz bulunuyor.")
      router.push('/home')
      return
    }

    if (!planName || !selectedPlan) {
      router.push('/subscription')
    }
  }, [session, status, planName, selectedPlan, router, courseId])

  // URL'den gelen referral kodu varsa otomatik doğrula
  useEffect(() => {
    if (refParam && !appliedReferral) {
      handleApplyReferral()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refParam])

  // Fiyat hesaplamaları
  const basePrice = selectedPlan?.price || 0
  const monthlyPrice = basePrice
  const sixMonthlyPrice = basePrice * 6 * 0.9
  const yearlyPrice = basePrice * 12 * 0.8

  // Ara toplam = indirimsiz orijinal fiyat
  const originalPrice = billingPeriod === "monthly" ? monthlyPrice : billingPeriod === "6monthly" ? basePrice * 6 : basePrice * 12
  // Dönem indirimi
  const periodDiscountedPrice = billingPeriod === "monthly" ? monthlyPrice : billingPeriod === "6monthly" ? sixMonthlyPrice : yearlyPrice
  const periodDiscount = originalPrice - periodDiscountedPrice

  // Referral indirim hesaplama (dönem indirimli fiyat üzerinden)
  let referralDiscount = 0
  if (appliedReferral) {
    referralDiscount = (periodDiscountedPrice * appliedReferral.discountPercent) / 100
  }

  const total = Math.max(0, periodDiscountedPrice - referralDiscount)

  // Referral kodu uygula
  const handleApplyReferral = async () => {
    const codeToValidate = referralCode.trim()
    if (!codeToValidate) {
      toast.error("Lütfen bir referans kodu girin")
      return
    }

    setValidatingCode(true)
    try {
      const response = await fetch("/api/referral/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToValidate.toUpperCase() })
      })

      const data = await response.json()

      if (data.valid) {
        setAppliedReferral({
          code: data.code,
          discountPercent: data.discountPercent,
          influencerName: data.influencerName
        })
        setReferralCode(data.code)
        toast.success(`%${data.discountPercent} indirim uygulandı!`)
      } else {
        toast.error(data.error || "Geçersiz referans kodu")
      }
    } catch (error) {
      toast.error("Bir hata oluştu")
    } finally {
      setValidatingCode(false)
    }
  }

  // Referral kodunu kaldır
  const handleRemoveReferral = () => {
    setAppliedReferral(null)
    setReferralCode("")
    toast.success("Referans kodu kaldırıldı")
  }

  // Ödemeye devam
  const handleProceedToPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/iyzico/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          price: total.toString(),
          billingPeriod,
          courseId,
          referralCode: appliedReferral?.code || undefined
        })
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("API non-JSON response:", text.substring(0, 500))
        toast.error(`Sistem hatası (${response.status}). Lütfen daha sonra tekrar deneyin.`)
        setLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        if (data.paymentPageUrl) {
          window.location.href = data.paymentPageUrl
        } else if (data.checkoutFormContent) {
          const checkoutContainer = document.getElementById('iyzico-checkout-form')
          if (checkoutContainer) {
            checkoutContainer.innerHTML = data.checkoutFormContent
            const scripts = checkoutContainer.getElementsByTagName('script')
            for (let i = 0; i < scripts.length; i++) {
              const script = document.createElement('script')
              script.text = scripts[i].text
              document.body.appendChild(script)
            }
          } else {
            const paymentWindow = window.open('', '_blank')
            paymentWindow?.document.write(data.checkoutFormContent)
          }
        }
      } else {
        toast.error(data.error || "Ödeme başlatılamadı")
        setLoading(false)
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error?.message || "Bir bağlantı hatası oluştu.")
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
                <span className="text-2xl font-bold text-white">Culinora</span>
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
            <span className="text-lg font-bold text-white">Culinora</span>
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
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Billing Period */}
              <div className="bg-black border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Ödeme Dönemi</h2>
                <div className="grid grid-cols-3 gap-4">
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
                    onClick={() => setBillingPeriod("6monthly")}
                    className={`p-4 rounded-xl border-2 transition-all relative ${billingPeriod === "6monthly"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-gray-700 hover:border-gray-600"
                      }`}
                  >
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      %10 İndirim
                    </div>
                    <div className="text-white font-semibold mb-1">6 Aylık</div>
                    <div className="text-sm text-gray-500 line-through">{Math.round(basePrice * 6)}₺</div>
                    <div className="text-2xl font-bold text-white">{Math.round(sixMonthlyPrice)}₺</div>
                    <div className="text-sm text-gray-400">/ 6 ay</div>
                    <div className="text-xs text-green-400 mt-1">
                      {Math.round(basePrice * 6 - sixMonthlyPrice)}₺ tasarruf
                    </div>
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
                    <div className="text-sm text-gray-500 line-through">{Math.round(basePrice * 12)}₺</div>
                    <div className="text-2xl font-bold text-white">{Math.round(yearlyPrice)}₺</div>
                    <div className="text-sm text-gray-400">/ yıl</div>
                    <div className="text-xs text-green-400 mt-1">
                      {Math.round(basePrice * 12 - yearlyPrice)}₺ tasarruf
                    </div>
                  </button>
                </div>
              </div>

              {/* Referans Kodu */}
              <div className="bg-black border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Referans Kodu</h2>
                {appliedReferral ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="text-white font-semibold">{appliedReferral.code}</div>
                        <div className="text-sm text-green-400">
                          %{appliedReferral.discountPercent} indirim uygulandı
                          {appliedReferral.influencerName && (
                            <span className="text-gray-400"> • {appliedReferral.influencerName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveReferral}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Referans kodunu girin"
                      className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono"
                      disabled={validatingCode}
                    />
                    <button
                      onClick={handleApplyReferral}
                      disabled={validatingCode || !referralCode.trim()}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {validatingCode ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Kontrol...
                        </>
                      ) : (
                        "Uygula"
                      )}
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Bir referans kodunuz varsa buraya girerek indirimden yararlanın
                </p>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-black border border-gray-800 rounded-xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Sipariş Özeti</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Ara Toplam</span>
                    <span>{Math.round(originalPrice)}₺</span>
                  </div>

                  {billingPeriod === "6monthly" && (
                    <div className="flex justify-between text-green-400">
                      <span>6 Aylık İndirim (%10)</span>
                      <span>-{Math.round(periodDiscount)}₺</span>
                    </div>
                  )}

                  {billingPeriod === "yearly" && (
                    <div className="flex justify-between text-green-400">
                      <span>Yıllık İndirim (%20)</span>
                      <span>-{Math.round(periodDiscount)}₺</span>
                    </div>
                  )}

                  {appliedReferral && (
                    <div className="flex justify-between text-green-400">
                      <span>Referans İndirimi (%{appliedReferral.discountPercent})</span>
                      <span>-{Math.round(referralDiscount)}₺</span>
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between text-white text-xl font-bold">
                      <span>Toplam</span>
                      <span>{Math.round(total)}₺</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {billingPeriod === "monthly" ? "Aylık" : billingPeriod === "6monthly" ? "6 Aylık" : "Yıllık"} ödeme
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

                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="relative h-10 w-48">
                    <Image
                      src="/iyzico-logo-pack/checkout_iyzico_ile_ode/TR/Tr_White_Horizontal/iyzico_ile_ode_horizontal_white.svg"
                      alt="iyzico ile Öde"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="relative h-6 w-56">
                    <Image
                      src="/iyzico-logo-pack/footer_iyzico_ile_ode/White/logo_band_white.svg"
                      alt="Visa, MasterCard, Troy"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <Link href="/iptal-iade" className="hover:text-gray-300 transition-colors underline">İptal ve İade</Link>
                    <span>•</span>
                    <Link href="/teslimat-iade" className="hover:text-gray-300 transition-colors underline">Teslimat ve İade</Link>
                  </div>
                </div>
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
          <Link href="/chef-sor" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef&apos;e Sor</span>
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
      <div id="iyzico-checkout-form" className="responsive"></div>
      <CheckoutContent />
    </Suspense>
  )
}
