"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Copy, Users, DollarSign, TrendingUp, ChefHat, Home, BookOpen, MessageCircle, Loader2, Share2 } from "lucide-react"
import { toast } from "react-hot-toast"
import UserDropdown from "@/components/ui/UserDropdown"

interface ReferralItem {
    id: string
    amount: number
    commission: number
    createdAt: string
    referredUser: {
        name: string
        email: string
        image: string | null
    }
}

export default function InfluencerDashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<{
        referralCode: string
        totalReferrals: number
        totalEarnings: number
        totalRevenue: number
        recentReferrals: ReferralItem[]
        monthlyData: Record<string, { referrals: number, earnings: number }>
    } | null>(null)

    useEffect(() => {
        if (status === "loading") return
        if (!session) {
            router.push("/auth/signin")
            return
        }

        fetchStats()
    }, [session, status, router])

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/influencer/stats")
            if (res.status === 403) {
                router.push("/home")
                return
            }
            const data = await res.json()
            setStats(data)
        } catch {
            toast.error("İstatistikler yüklenemedi")
        } finally {
            setLoading(false)
        }
    }

    const copyCode = () => {
        if (stats?.referralCode) {
            navigator.clipboard.writeText(stats.referralCode)
            toast.success("Referral kodu kopyalandı!")
        }
    }

    const copyLink = () => {
        if (stats?.referralCode) {
            const link = `${window.location.origin}/checkout?plan=Premium&ref=${stats.referralCode}`
            navigator.clipboard.writeText(link)
            toast.success("Referral linki kopyalandı!")
        }
    }

    if (loading || !stats) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Desktop Header */}
            <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-gray-800">
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
                        </div>
                        <div className="flex items-center space-x-4">
                            {session?.user && <UserDropdown />}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-gray-800">
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
                        {session?.user && <UserDropdown />}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-20 md:pt-24 pb-20 md:pb-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white">Fenomen Paneli</h1>
                            <p className="text-gray-400 mt-1">Referral performansınızı takip edin</p>
                        </div>
                    </div>

                    {/* Referral Code Card */}
                    <div className="bg-gradient-to-r from-purple-900/40 to-orange-900/40 border border-purple-500/30 rounded-2xl p-6 mb-8">
                        <h2 className="text-lg font-semibold text-white mb-3">Referral Kodunuz</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-3 flex-1">
                                <code className="bg-black/50 text-orange-400 px-6 py-3 rounded-xl text-2xl font-mono font-bold tracking-wider flex-1 text-center">
                                    {stats.referralCode}
                                </code>
                                <button
                                    onClick={copyCode}
                                    className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-colors"
                                    title="Kodu kopyala"
                                >
                                    <Copy className="h-5 w-5" />
                                </button>
                            </div>
                            <button
                                onClick={copyLink}
                                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
                            >
                                <Share2 className="h-5 w-5" />
                                Linki Kopyala
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mt-3">
                            Bu kodu paylaşarak yeni aboneler getirin ve her abonelikten %10 komisyon kazanın!
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-blue-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <Users className="h-6 w-6 text-blue-400" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm font-medium">Getirilen Abone</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats.totalReferrals}</p>
                        </div>

                        <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-green-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-green-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-6 w-6 text-green-400" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm font-medium">Oluşturulan Gelir</p>
                            <p className="text-3xl font-bold text-white mt-1">₺{stats.totalRevenue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                        </div>

                        <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-yellow-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-yellow-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-6 w-6 text-yellow-400" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm font-medium">Toplam Kazanç</p>
                            <p className="text-3xl font-bold text-white mt-1">₺{stats.totalEarnings.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                            <p className="text-xs text-gray-500 mt-1">%10 komisyon</p>
                        </div>
                    </div>

                    {/* Monthly Breakdown */}
                    {Object.keys(stats.monthlyData).length > 0 && (
                        <div className="bg-neutral-900/30 border border-gray-800 rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-bold text-white mb-4">Aylık Performans</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(stats.monthlyData).map(([month, data]) => (
                                    <div key={month} className="bg-black border border-gray-800 rounded-lg p-4">
                                        <p className="text-sm text-gray-400 mb-2">{month}</p>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xl font-bold text-white">{data.referrals}</p>
                                                <p className="text-xs text-gray-500">abone</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-yellow-400">₺{data.earnings.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                                                <p className="text-xs text-gray-500">kazanç</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Referrals */}
                    <div className="bg-neutral-900/30 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-800">
                            <h2 className="text-lg font-bold text-white">Son Referral&apos;lar</h2>
                        </div>
                        {stats.recentReferrals.length === 0 ? (
                            <div className="p-12 text-center">
                                <Users className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                                <p className="text-gray-500">Henüz referral bulunmuyor</p>
                                <p className="text-sm text-gray-600 mt-2">Referral kodunuzu paylaşarak kazanmaya başlayın!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {stats.recentReferrals.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {r.referredUser.image ? (
                                                <img className="h-10 w-10 rounded-full" src={r.referredUser.image} alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                                                    {r.referredUser.name?.charAt(0) || "U"}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-white">{r.referredUser.name || r.referredUser.email}</p>
                                                <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-300">₺{r.amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ödeme</p>
                                            <p className="text-sm font-semibold text-yellow-400">+₺{r.commission.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} komisyon</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
