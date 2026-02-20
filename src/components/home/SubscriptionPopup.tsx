"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Crown, Sparkles, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface SubscriptionPopupProps {
    isVisible: boolean
}

export default function SubscriptionPopup({ isVisible }: SubscriptionPopupProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (isVisible) {
            // Sayfa yüklendikten 1.5 saniye sonra göster
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [isVisible])

    if (!isVisible) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    {/* Backdrop kapatma */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 cursor-pointer"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
                    >
                        {/* Dekoratif Backdrop Glow */}
                        <div className="absolute -top-16 -left-16 w-48 h-48 bg-orange-600/15 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none" />

                        {/* Kapat Butonu */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all z-20 group"
                        >
                            <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        {/* Banner Görseli / İkon Alanı */}
                        <div className="relative h-32 bg-gradient-to-br from-orange-600 to-orange-950 flex flex-col items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
                            </div>
                            <motion.div
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="relative z-10 flex flex-col items-center"
                            >
                                <div className="relative w-12 h-12 mb-2">
                                    <Image
                                        src="/logo.jpeg"
                                        alt="Culinora Logo"
                                        fill
                                        className="object-contain rounded-lg shadow-2xl"
                                    />
                                </div>
                                <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                                    <Crown className="h-3 w-3 text-orange-400" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Premium</span>
                                </div>
                            </motion.div>

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"></div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                                    Mutfakta <span className="text-orange-500">Ustalığa</span> Eriş!
                                </h2>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                                    Kısıtlı erişimden kurtul. Dünyaca ünlü şeflerin tüm reçeteleri seni bekliyor.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mb-8 lowercase font-medium">
                                {[
                                    "Sınırsız Kurs Erişimi",
                                    "Özel Şef Reçeteleri",
                                    "Canlı Soru-Cevaplar",
                                    "Resmi Sertifikalar"
                                ].map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 + (i * 0.05) }}
                                        className="flex items-center gap-2.5 bg-white/[0.03] border border-white/5 p-2.5 rounded-xl px-4"
                                    >
                                        <Check className="h-3.5 w-3.5 text-orange-500" />
                                        <span className="text-[13px] text-gray-300 capitalize">{feature}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/subscription?plan=Premium"
                                    onClick={() => setIsOpen(false)}
                                    className="group relative flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white h-12 rounded-xl font-bold text-base transition-all shadow-[0_15px_30px_-10px_rgba(249,115,22,0.4)] active:scale-95 overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Aramıza Katıl
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </Link>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-orange-400 font-bold transition-all py-1.5 text-[11px] uppercase tracking-[0.2em] active:scale-95"
                                >
                                    Sonra Keşfedeceğim
                                </button>
                            </div>
                        </div>

                        {/* Alt Bilgi */}
                        <div className="bg-black py-3 px-6 border-t border-white/5 flex justify-center items-center gap-2">
                            <p className="text-[9px] text-gray-700 uppercase tracking-[0.3em] font-black">
                                Culinora Excellence • 2026
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
