"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { ChefHat, Check, Crown, BookOpen, Home, Users, MessageCircle, Loader2, Tag, X, LucideIcon, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import UserDropdown from "@/components/ui/UserDropdown"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import CustomCardForm from "@/components/checkout/CustomCardForm"

function CheckoutContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const planName = searchParams.get("plan")
  const courseId = searchParams.get("courseId")
  const refParam = searchParams.get("ref")

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    planName === "Premium Yıllık" ? "yearly" : "monthly"
  )
  const [referralCode, setReferralCode] = useState(refParam || "")
  const [appliedReferral, setAppliedReferral] = useState<{ code: string, discountPercent: number, influencerName: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [validatingCode, setValidatingCode] = useState(false)
  const [formLoaded, setFormLoaded] = useState(false)
  const [paymentError, setPaymentError] = useState<string | undefined>(undefined)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Plan bilgileri
  const plans: Record<string, { price: number, icon: LucideIcon, color: string }> = {
    "Premium": { price: 20, icon: Crown, color: "from-orange-600 to-red-600" },
    "Premium Yıllık": { price: 20, icon: Crown, color: "from-orange-600 to-red-600" }
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

  const originalPrice = billingPeriod === "monthly" ? monthlyPrice : basePrice * 12
  // Dönem indirimi
  const periodDiscountedPrice = billingPeriod === "monthly" ? monthlyPrice : yearlyPrice
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

  // Özel Kart Formu ile Ödeme (NON3D Subscription)
  const handleCustomCardPayment = async (cardData: any) => {
    setLoading(true)
    setPaymentError(undefined) // clear previous errors

    try {
      const response = await fetch("/api/iyzico/subscribe-non3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          billingPeriod,
          courseId,
          referralCode: appliedReferral?.code || undefined,
          cardData
        })
      })

      const data = await response.json()

      if (data.success) {
        // Doğrudan başarılı oldu, başarı ekranını göster ve yönlendir
        setPaymentSuccess(true)
        toast.success("Aboneliğiniz başarıyla başlatıldı!")
        setTimeout(() => {
          router.push("/my-courses")
        }, 2500)
      } else {
        // Hata mesajını form komponentine yolla
        setPaymentError(data.error || "Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.")
        setLoading(false)
      }
    } catch (error) {
      console.error("Custom payment error:", error)
      setPaymentError("Sistemde bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.")
      setLoading(false)
    }
  }

  // Eski ödeme butonu (buton tıklanınca form geliyordu) - Artık form hep görünür olacaksa bunu kaldırabiliriz 
  // veya "Kart ile Öde" butonu gibi kullanabiliriz.
  // Mevcut yapıda "Ödemeye Devam" butonu formu yükleyip gösteriyordu.
  // Kullanıcının "kart girilen yeri kendim yapmak istiyorum" isteğine göre, 
  // "Ödemeye Devam" deyince formun açılması veya formun hep sağda/altta olması sağlanabilir.
  // Biz "Ödemeye Devam" deyince özel formumuzu açalım.
  const handleProceedToPayment = async () => {
    setFormLoaded(true) // Artık özel formumuzu göstereceğiz
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
              <Link href="/home" className="flex items-center gap-0.5">
                <div className="relative w-10 h-10">

                  <Image

                    src="/logo.png"

                    alt="C"

                    fill

                    className="object-contain"

                  />

                </div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-orange-500" style={{ marginLeft: "-6px" }}>ulin</span><span className="text-white" style={{ marginLeft: "0px" }}>ora</span>
                </span>
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
          <Link href="/home" className="flex items-center gap-0.5">
            <div className="relative w-8 h-8">

              <Image

                src="/logo.png"

                alt="C"

                fill

                className="object-contain"

              />

            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-orange-500" style={{ marginLeft: "-6px" }}>ulin</span><span className="text-white" style={{ marginLeft: "0px" }}>ora</span>
            </span>
          </Link>
          <div className="flex items-center space-x-3">
            {session?.user && <UserDropdown />}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 md:pt-24 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Grid Checkout Layout */}
          <div className="flex flex-col gap-10 mt-6">
            
            {/* Top Section: Premium Plan Banner */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col md:flex-row items-center justify-between"
                 style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                {/* Left side: Background Collage */}
                <div className="w-full md:w-1/2 h-48 md:h-full relative overflow-hidden hidden md:block" style={{ minHeight: '180px' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-950/50 to-zinc-950 z-10" />
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-1 p-2 opacity-40">
                        {/* Course thumbnails */}
                        {[
                            "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=2071&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1414235077428-33898ed1e830?q=80&w=2070&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=2070&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?q=80&w=1984&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2070&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1581349485608-9469926a8e5e?q=80&w=1964&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?q=80&w=2070&auto=format&fit=crop"
                        ].map((src, i) => (
                           <div key={i} className="relative rounded overflow-hidden">
                               <Image 
                                   src={src} 
                                   alt={`Course ${i+1}`} 
                                   fill 
                                   className="object-cover"
                               />
                           </div>
                        ))}
                    </div>
                </div>

                {/* Right side: Plan Info */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col items-center md:items-end justify-center text-center md:text-right relative z-20">
                    <h2 className="text-3xl font-bold text-white mb-6">Premium Üyelik</h2>
                    
                    {/* Toggle: Aylık / Yıllık */}
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-full max-w-sm mb-2 relative">
                        <button 
                            onClick={() => setBillingPeriod("monthly")}
                            className={`flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all ${billingPeriod === 'monthly' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Aylık Plan
                        </button>
                        <button 
                            onClick={() => setBillingPeriod("yearly")}
                            className={`flex flex-col items-center justify-center flex-1 py-2 px-4 text-sm font-semibold rounded-md transition-all relative ${billingPeriod === 'yearly' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <span>Yıllık Plan</span>
                            <span className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${billingPeriod === 'yearly' ? 'text-white/80' : 'text-green-400'}`}>%20 İndirim</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Grid Layout for Form & Summary */}
            <div className="w-full">
                {paymentSuccess ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900/80 backdrop-blur-xl border border-green-500/30 rounded-2xl p-10 text-center shadow-[0_0_50px_-10px_rgba(34,197,94,0.3)] max-w-md mx-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                        >
                            <div className="absolute inset-0 border-2 border-green-500/50 rounded-full animate-ping opacity-50"></div>
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-3">Ödeme Başarılı!</h2>
                        <p className="text-zinc-400 mb-6">Aboneliğiniz başarıyla başlatıldı. Sizi eğitimlerinize yönlendiriyoruz...</p>
                        <div className="flex justify-center">
                            <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Side: Custom Card Form */}
                        <div className="lg:col-span-2 w-full">
                            <CustomCardForm 
                                onSuccess={handleCustomCardPayment} 
                                loading={loading} 
                                errorMessage={paymentError}
                                referral={{
                                    code: referralCode,
                                    setCode: setReferralCode,
                                    applied: appliedReferral,
                                    onApply: handleApplyReferral,
                                    onRemove: handleRemoveReferral,
                                    validating: validatingCode
                                }}
                            />
                        </div>

                        {/* Right Side: Order Summary Sidebar */}
                        <div className="lg:col-span-1 w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sticky top-24" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <h3 className="text-xl font-bold text-white mb-6">İşlem Özeti</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-zinc-400 font-medium">
                                    <span>Ara Toplam</span>
                                    <span>₺{Math.round(originalPrice)}</span>
                                </div>

                                {billingPeriod === "yearly" && (
                                    <div className="flex justify-between text-green-400 text-sm font-medium">
                                        <span>Yıllık İndirim (%20)</span>
                                        <span>-₺{Math.round(periodDiscount)}</span>
                                    </div>
                                )}

                                {appliedReferral && (
                                    <div className="flex justify-between text-green-400 text-sm font-medium">
                                        <span>Promosyon İndirimi (%{appliedReferral.discountPercent})</span>
                                        <span>-₺{Math.round(referralDiscount)}</span>
                                    </div>
                                )}

                                <div className="border-t border-zinc-800 pt-4 mt-2">
                                    <div className="flex justify-between items-center text-white">
                                        <span className="font-semibold text-lg">Ödenecek Tutar</span>
                                        <div className="text-right">
                                            <span className="text-3xl font-bold text-orange-500">₺{Math.round(total)}</span>
                                            <div className="text-xs text-zinc-500 mt-1">
                                                {billingPeriod === 'monthly' ? 'Aylık yenileme' : 'Yıllık yenileme'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Details inside Sidebar */}
                            <div className="mt-6 pt-6 border-t border-zinc-800/50 flex flex-col items-center gap-4">
                                <div className="relative h-8 w-40 opacity-70">
                                    <Image
                                        src="/iyzico-logo-pack/checkout_iyzico_ile_ode/TR/Tr_White_Horizontal/iyzico_ile_ode_horizontal_white.svg"
                                        alt="iyzico ile Öde"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <div className="relative h-6 w-48 opacity-60">
                                    <Image
                                        src="/iyzico-logo-pack/footer_iyzico_ile_ode/White/logo_band_white.svg"
                                        alt="Visa, MasterCard, Troy"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <div className="flex gap-4 text-xs text-zinc-500 font-medium">
                                    <Link href="/iptal-iade" className="hover:text-zinc-300 transition-colors">İptal ve İade</Link>
                                    <span className="text-zinc-700">•</span>
                                    <Link href="/teslimat-iade" className="hover:text-zinc-300 transition-colors">Teslimat Şartları</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
      <CheckoutContent />
    </Suspense>
  )
}
