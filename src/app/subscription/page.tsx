"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { ChefHat, Check, Crown, Sparkles, BookOpen, Award, Users, MessageCircle, Home, Zap, Star, Loader2 } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

export default function SubscriptionPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    const handleSubscription = async (planName: string, price: string) => {
        if (!session) {
            router.push("/auth/signin?callbackUrl=/subscription")
            return
        }

        try {
            setLoading(planName)
            const response = await fetch("/api/iyzico/initialize-subscription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planName,
                    price,
                }),
            })

            const data = await response.json()

            if (data.success && data.paymentPageUrl) {
                window.location.href = data.paymentPageUrl
            } else {
                toast.error(data.error || "Ödeme başlatılamadı")
                setLoading(null)
            }
        } catch (error) {
            console.error("Subscription error:", error)
            toast.error("Bir hata oluştu")
            setLoading(null)
        }
    }

    const plans = [
        {
            name: "Commis",
            price: "199",
            period: "Aylık",
            icon: BookOpen,
            color: "from-gray-600 to-gray-700",
            borderColor: "border-gray-500/50",
            buttonColor: "bg-gray-600 hover:bg-gray-700",
            features: [
                "Temel içerikler",
                "Sertifika desteği",
                "Topluluk erişimi",
                "Mobil erişim"
            ]
        },
        {
            name: "Chef D party",
            price: "399",
            period: "Aylık",
            icon: Crown,
            color: "from-orange-600 to-red-600",
            borderColor: "border-orange-500/50",
            buttonColor: "bg-orange-600 hover:bg-orange-700",
            popular: true,
            features: [
                "Tüm kurslara sınırsız erişim",
                "Yeni içeriklere anında erişim",
                "Premium topluluk erişimi",
                "Eğitmenlerle doğrudan iletişim",
                "Mobil ve masaüstü erişim",
                "Öncelikli destek"
            ]
        },
        {
            name: "Executive",
            price: "599",
            period: "Aylık",
            icon: Zap,
            color: "from-purple-600 to-pink-600",
            borderColor: "border-purple-500/50",
            buttonColor: "bg-purple-600 hover:bg-purple-700",
            features: [
                "Premium'daki tüm özellikler",
                "1-1 mentorluk seansları",
                "Özel proje incelemeleri",
                "Kariyer danışmanlığı",
                "Sınırsız canlı workshop",
                "VIP topluluk erişimi",
                "7/24 öncelikli destek"
            ]
        }
    ]

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
                        <span className="text-lg font-bold text-white">Chef2.0</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {plans.map((plan) => {
                            const Icon = plan.icon
                            const isLoading = loading === plan.name
                            return (
                                <div
                                    key={plan.name}
                                    className={`relative bg-gradient-to-br ${plan.color.replace('from-', 'from-').replace('to-', 'to-')}/20 border-2 ${plan.borderColor} rounded-2xl p-8 ${plan.popular ? 'md:scale-110 md:shadow-2xl' : ''} transition-all duration-300 hover:scale-105`}
                                >
                                    {/* Popular Badge */}
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                                <Star className="h-4 w-4" />
                                                EN POPÜLER
                                            </div>
                                        </div>
                                    )}

                                    {/* Icon */}
                                    <div className="flex justify-center mb-6">
                                        <div className={`bg-gradient-to-br ${plan.color} rounded-full p-4`}>
                                            <Icon className="h-10 w-10 text-white" />
                                        </div>
                                    </div>

                                    {/* Plan Name */}
                                    <h3 className="text-2xl font-bold text-white text-center mb-2">{plan.name}</h3>

                                    {/* Price */}
                                    <div className="text-center mb-6">
                                        <div className="text-5xl font-bold text-white mb-1">
                                            {plan.price} ₺
                                        </div>
                                        <p className="text-gray-300">/ {plan.period}</p>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleSubscription(plan.name, plan.price)}
                                        disabled={!!loading}
                                        className={`w-full ${plan.buttonColor} text-white text-lg font-bold py-3 rounded-xl transition-all duration-300 mb-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                İşleniyor...
                                            </>
                                        ) : (
                                            "Başlat"
                                        )}
                                    </button>

                                    {/* Features */}
                                    <div className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                                                    <Check className="h-4 w-4 text-green-400" />
                                                </div>
                                                <span className="text-gray-300 text-sm">{feature}</span>
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
                    <Link href="/messages" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Mesajlar</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
