"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { ChefHat, Check, Crown, Sparkles, BookOpen, Award, Users, MessageCircle, Home, Zap, Star, Loader2 } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"

function SubscriptionContent() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const courseId = searchParams.get("courseId")
    const planParam = searchParams.get("plan") // URL'den plan parametresini al
    const [loading, setLoading] = useState<string | null>(null)
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

    const handleSubscription = (planName: string) => {
        if (!session) {
            // Include plan and courseId in callback URL so user returns here after login
            const callbackParams = new URLSearchParams()
            callbackParams.set('plan', planName)
            if (courseId) callbackParams.set('courseId', courseId)
            router.push(`/auth/signin?callbackUrl=/subscription?${callbackParams.toString()}`)
            return
        }

        // Checkout sayfasına yönlendir
        const checkoutUrl = `/checkout?plan=${encodeURIComponent(planName)}${courseId ? `&courseId=${courseId}` : ''}`
        router.push(checkoutUrl)
    }




    const plans = [
        {
            name: "Premium",
            price: "299",
            period: "Aylık",
            icon: Crown,
            color: "from-orange-600 to-red-600",
            borderColor: "border-orange-500/50",
            buttonColor: "bg-orange-600 hover:bg-orange-700",

            features: [
                "Tüm kurslara sınırsız erişim",
                "Yeni içeriklere anında erişim",
                "Premium topluluk erişimi",
                "Eğitmenlerle doğrudan iletişim",
                "Mobil ve masaüstü erişim",
                "Öncelikli destek",
                "1-1 mentorluk seansları",
                "Sertifika desteği"
            ]
        }
    ]

    // URL'den gelen plan parametresi varsa, direkt o planı başlat
    useEffect(() => {
        if (planParam && session) {
            const plan = plans.find(p => p.name === planParam)
            if (plan) {
                handleSubscription(plan.name)
            }
        }
    }, [planParam, session])

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
                            {session?.user && (
                                <nav className="hidden md:flex space-x-6">
                                    <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                                        Ana Sayfa
                                    </Link>
                                    <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                                        Kurslarım
                                    </Link>
                                    <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">
                                      Culi
                                    </Link>
                                    <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                                        Chef Sosyal
                                    </Link>
                                </nav>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            {session?.user ? (
                                <UserDropdown />
                            ) : (
                                <>
                                    <Link
                                        href="/auth/signin"
                                        className="text-gray-300 hover:text-orange-500"
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
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

                            src="/logo.jpeg"

                            alt="C"

                            fill

                            className="object-contain"

                          />

                        </div>
                        <span className="text-lg font-bold tracking-tight">
                          <span className="text-orange-500">ulin</span>
                          <span className="text-white">ora</span>
                        </span>
                    </Link>
                    <div className="flex items-center space-x-3">
                        {session?.user ? (
                            <UserDropdown />
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="text-gray-300 hover:text-orange-500 text-sm"
                            >
                                Giriş Yap
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-20 md:pt-24 pb-20 md:pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-full px-6 py-2 mb-6">
                            <Sparkles className="h-5 w-5 text-orange-400" />
                            <span className="text-orange-400 font-semibold">Premium Üyelik</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Seni Bekleyen Eşsiz Deneyime<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                                Hemen Başla!
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Tüm eğitimlere sınırsız erişim, premium içerikler ve daha fazlası!
                        </p>
                    </div>

                    {/* Billing Toggle */}
                    <div className="flex justify-center mb-10 mt-6">
                        <div className="bg-[#1a1005] p-1.5 rounded-2xl border border-orange-500/30 inline-flex items-center shadow-xl relative">
                            {/* Option 1: Aylık */}
                            <button
                                onClick={() => setBillingPeriod("monthly")}
                                className={`w-32 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 relative z-10 ${billingPeriod === "monthly"
                                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                Aylık
                            </button>

                            {/* Option 2: Yıllık */}
                            <div className="relative w-32">
                                {/* Flying Badge */}
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                                    <span className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm border border-green-400/50">
                                        %20 İndirim
                                    </span>
                                    {/* Small arrow pointing down */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500/90 rotate-45 border-r border-b border-green-400/50"></div>
                                </div>
                                <button
                                    onClick={() => setBillingPeriod("yearly")}
                                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 relative z-10 ${billingPeriod === "yearly"
                                        ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    Yıllık
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="flex justify-center mb-16">
                        {(() => {
                            const isYearly = billingPeriod === "yearly"
                            const basePrice = 299
                            const yearlyPrice = Math.round(basePrice * 12 * 0.8)
                            const displayPrice = isYearly ? yearlyPrice.toString() : basePrice.toString()
                            const displayPeriod = isYearly ? "yıl" : "ay"

                            const plan = {
                                name: isYearly ? "Yıllık" : "Aylık",
                                price: displayPrice,
                                period: displayPeriod,
                                total: `${displayPrice} ₺ / ${displayPeriod}`,
                                planName: isYearly ? "Premium Yıllık" : "Premium",
                                icon: Crown,
                                color: "from-orange-900 to-red-900",
                                borderColor: "border-orange-500/50",
                                buttonColor: "bg-orange-600 hover:bg-orange-700",
                            }
                            const Icon = plan.icon
                            const isLoading = loading === plan.planName
                            const commonFeatures = [
                                "Tüm kurslara sınırsız erişim",
                                "Yeni içeriklere anında erişim",
                                "Premium topluluk erişimi",
                                "Eğitmenlerle doğrudan iletişim",
                                "Mobil ve masaüstü erişim",
                                "Öncelikli destek",
                                "Sertifika desteği"
                            ]

                            return (
                                <div className="relative w-full max-w-sm bg-gradient-to-br from-[#1a1005] to-[#120505] border border-orange-500/30 rounded-2xl p-6 transition-all duration-300 hover:border-orange-500/60 shadow-2xl">
                                    {/* Plan Name */}
                                    <div className="text-center mb-4">
                                        <h3 className="text-lg font-semibold text-orange-400">Premium {plan.name} Plan</h3>
                                    </div>

                                    {/* Price */}
                                    <div className="text-center mb-6">
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                                            <span className="text-xl font-bold text-orange-500">₺</span>
                                            <span className="text-gray-400 text-sm font-medium ml-1">/ {plan.period}</span>
                                        </div>
                                        {isYearly && (
                                            <div className="text-green-400 text-xs font-semibold mt-2">
                                                Aylık sadece {Math.round(yearlyPrice / 12)} ₺'ye denk gelir!
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleSubscription(plan.planName)}
                                        disabled={!!loading}
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-base font-bold py-3 rounded-xl transition-all duration-300 mb-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                İşleniyor...
                                            </>
                                        ) : (
                                            "Hemen Başla"
                                        )}
                                    </button>

                                    {/* Features */}
                                    <div className="space-y-3 border-t border-white/5 pt-6">
                                        {commonFeatures.map((feature, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="bg-green-500/10 rounded-full p-0.5 flex-shrink-0 mt-0.5">
                                                    <Check className="h-3.5 w-3.5 text-green-400" />
                                                </div>
                                                <span className="text-gray-300 text-sm leading-tight">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="bg-black border border-gray-800 rounded-xl p-6 text-center">
                            <div className="bg-orange-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sınırsız Öğrenme</h3>
                            <p className="text-gray-400">Tüm kurslara istediğiniz zaman erişin</p>
                        </div>

                        <div className="bg-black border border-gray-800 rounded-xl p-6 text-center">
                            <div className="bg-orange-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Award className="h-8 w-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sertifikalar</h3>
                            <p className="text-gray-400">Her kurs için profesyonel sertifika</p>
                        </div>

                        <div className="bg-black border border-gray-800 rounded-xl p-6 text-center">
                            <div className="bg-orange-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Users className="h-8 w-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Topluluk</h3>
                            <p className="text-gray-400">Premium üyelerle networking</p>
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

export default function SubscriptionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            </div>
        }>
            <SubscriptionContent />
        </Suspense>
    )
}
