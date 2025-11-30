"use client"

import { Crown, Gift } from "lucide-react"
import Link from "next/link"

export default function SubscriptionBanner() {
    return (
        <div className="w-full bg-gradient-to-r from-red-900/40 via-red-800/40 to-black/40 border border-red-800/30 rounded-xl p-8 mb-8">
            <div className="max-w-4xl mx-auto">
                {/* Başlık */}
                <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-2">
                    Seni Bekleyen Eşsiz Deneyime Hemen Başla!
                </h2>

                {/* Premium Plan */}
                <div className="bg-gradient-to-r from-red-600/30 to-black/50 border border-red-500/30 rounded-xl p-6 mt-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Sol Taraf - Plan Bilgisi */}
                        <div className="flex items-center gap-4">
                            <div className="bg-red-600 rounded-full p-3">
                                <Crown className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">PREMIUM</h3>
                                <p className="text-gray-300 text-lg">Neo Skoladaki Tüm Eğitimler!</p>
                            </div>
                        </div>

                        {/* Orta - Fiyat */}
                        <div className="text-center">
                            <div className="text-4xl font-bold text-white mb-1">
                                199 ₺
                                <span className="text-lg text-gray-300 ml-2">/ Taksitli</span>
                            </div>
                        </div>

                        {/* Sağ Taraf - Butonlar */}
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <Link
                                href="/subscription"
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 text-center whitespace-nowrap"
                            >
                                Üyeliğini Başlat
                            </Link>
                            <button className="bg-black/50 hover:bg-black/70 border border-red-500/50 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                                <Gift className="h-5 w-5" />
                                Hediye Et
                            </button>
                        </div>
                    </div>
                </div>

                {/* Özellikler */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-black/30 border border-red-800/20 rounded-lg p-4 text-center">
                        <p className="text-white font-semibold">✨ Tüm Kurslara Erişim</p>
                    </div>
                    <div className="bg-black/30 border border-red-800/20 rounded-lg p-4 text-center">
                        <p className="text-white font-semibold">🎓 Sertifika Desteği</p>
                    </div>
                    <div className="bg-black/30 border border-red-800/20 rounded-lg p-4 text-center">
                        <p className="text-white font-semibold">💎 Premium İçerikler</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
