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
                {/* Left side: Background Collage (Simulated with gradients and a placeholder or real images if available) */}
                <div className="w-full md:w-1/2 h-48 md:h-full relative overflow-hidden hidden md:block" style={{ minHeight: '180px' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950 z-10" />
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-1 p-2 opacity-50">
                        {/* Dummy squares to simulate the chef collage */}
                        {Array.from({ length: 8 }).map((_, i) => (
                           <div key={i} className="bg-zinc-800/80 rounded animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </div>
                </div>

                {/* Right side: Plan Info */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col items-center md:items-end justify-center text-center md:text-right relative z-20">
                    <h2 className="text-3xl font-bold text-white mb-6">Premium Paket</h2>
                    
                    {/* Toggle */}
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-full max-w-sm mb-6">
                        <button 
                            onClick={() => setBillingPeriod("monthly")}
                            className={`flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all ${billingPeriod === 'monthly' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Peşin Ödeme
                        </button>
                        <button 
                            onClick={() => setBillingPeriod("yearly")}
                            className={`flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all ${billingPeriod === 'yearly' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Taksitli Ödeme
                        </button>
                    </div>

                    <div className="flex items-end gap-2 text-white">
                        <span className="text-lg text-zinc-400 font-medium">Toplam Fiyat:</span>
                        <span className="text-3xl font-bold">₺{Math.round(total)}</span>
                    </div>
                </div>
            </div>

            {/* Invoice Toggle */}
            <div className="flex items-center justify-center gap-6 mt-4 mb-2">
                <button className="text-red-600 font-bold hover:text-red-500 transition-colors">Bireysel Fatura</button>
                <div className="w-px h-5 bg-zinc-700" />
                <button className="text-zinc-500 font-medium hover:text-zinc-400 transition-colors">Kurumsal Fatura</button>
            </div>

            {/* Bottom Section: Card Form */}
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
                    <CustomCardForm 
                        onSuccess={handleCustomCardPayment} 
                        loading={loading} 
                        errorMessage={paymentError} 
                    />
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
