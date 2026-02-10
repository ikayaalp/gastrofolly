"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
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

    // Eğer plan parametresi varsa, direkt o planı başlat
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
                            <Link href="/home" className="flex items-center space-x-2">
                                <ChefHat className="h-8 w-8 text-orange-500" />
                                <span className="text-2xl font-bold text-white">Culinora</span>
                            </Link>
                            {session?.user && (
                                <nav className="hidden md:flex space-x-6">
                                    <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                                        Ana Sayfa
                                    </Link>
                                    <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                                        Kurslarım
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
                    <Link href="/home" className="flex items-center space-x-2">
                        <ChefHat className="h-6 w-6 text-orange-500" />
                        <span className="text-lg font-bold text-white">Culinora</span>
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

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-start">
                        {/* Aylık Plan */}
                        {[
                            {
                                name: "Aylık",
                                price: "299",
                                period: "Ay",
                                total: "299 ₺ / Ay",
                                icon: Star,
                                color: "from-gray-800 to-gray-900",
                                borderColor: "border-gray-700",
                                buttonColor: "bg-gray-700 hover:bg-gray-600",
                                popular: false,
                                discount: null,
                                features: [
                                    "Tüm kurslara erişim",
                                    "Sertifika desteği",
                                    "Mobil uygulama erişimi",
                                    "İstediğin zaman iptal et"
                                ]
                            },
                            {
                                name: "6 Aylık",
                                price: "1615",
                                period: "6 Ay",
                                total: "Ortalama 269 ₺ / Ay",
                                icon: Crown,
                                color: "from-orange-900 to-red-900",
                                borderColor: "border-orange-500/50",
                                buttonColor: "bg-orange-600 hover:bg-orange-700",
                                popular: true, // Highlight middle option
                                discount: "%10 İndirim",
                                features: [
                                    "Tüm kurslara sınırsız erişim",
                                    "Yeni içeriklere anında erişim",
                                    "Premium topluluk erişimi",
                                    "Eğitmenlerle doğrudan iletişim",
                                    "Öncelikli destek",
                                    "Sertifika desteği"
                                ]
                            },
                            {
                                name: "Yıllık",
                                price: "2870",
                                period: "Yıl",
                                total: "Ortalama 239 ₺ / Ay",
                                icon: Award,
                                color: "from-yellow-900 to-orange-900",
                                borderColor: "border-yellow-500/50",
                                buttonColor: "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500",
                                popular: false,
                                discount: "%20 İndirim",
                                features: [
                                    "Tüm özelliklere tam erişim",
                                    "En avantajlı fiyat",
                                    "1-1 Mentorluk hakkı",
                                    "Kariyer danışmanlığı",
                                    "Özel etkinliklere davetiye",
                                    "Sertifika desteği"
                                ]
                            }
                        ].map((plan) => {
                            const Icon = plan.icon
                            const isLoading = loading === plan.name
                            return (
                                <div
                                    key={plan.name}
                                    className={`relative w-full bg-gradient-to-br ${plan.color.replace('from-', 'from-').replace('to-', 'to-')}/40 border-2 ${plan.borderColor} rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${plan.popular ? 'transform scale-105 shadow-2xl shadow-orange-900/40 z-10' : 'opacity-90 hover:opacity-100'}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                            En Popüler
                                        </div>
                                    )}

                                    {plan.discount && (
                                        <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/50 px-2 py-0.5 rounded text-xs font-bold">
                                            {plan.discount}
                                        </div>
                                    )}

                                    {/* Plan Name */}
                                    <div className="text-center mb-4 mt-2">
                                        <h3 className="text-xl font-bold text-white">{plan.name} Plan</h3>
                                    </div>

                                    {/* Icon */}
                                    <div className="flex justify-center mb-4">
                                        <div className={`bg-gradient-to-br ${plan.color} rounded-full p-3 ring-1 ring-white/10`}>
                                            <Icon className="h-8 w-8 text-white" />
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-center mb-6">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                                            <span className="text-xl font-bold text-orange-500">₺</span>
                                        </div>
                                        <div className="text-gray-400 text-sm mt-1 font-medium">/ {plan.period}</div>
                                        <div className="text-xs text-gray-500 mt-2 bg-black/30 py-1 px-2 rounded inline-block">
                                            {plan.total}
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleSubscription(plan.name)}
                                        disabled={!!loading}
                                        className={`w-full ${plan.buttonColor} text-white text-base font-bold py-3 rounded-xl transition-all duration-300 mb-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
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
                                        {plan.features.map((feature, index) => (
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
                        })}
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
