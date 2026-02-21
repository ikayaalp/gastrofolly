"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Crown, Sparkles, Check, ArrowRight, BookOpen, Users, Award, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface SubscriptionPopupProps {
    isVisible: boolean
}

const features = [
    { icon: BookOpen, text: "Tüm kurslara sınırsız erişim" },
    { icon: Zap, text: "Yeni içeriklere anında erişim" },
    { icon: Users, text: "Premium topluluk & Eğitmenlerle iletişim" },
    { icon: Award, text: "Resmi tamamlama sertifikaları" },
]

export default function SubscriptionPopup({ isVisible }: SubscriptionPopupProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => setIsOpen(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [isVisible])

    if (!isVisible) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[99] bg-black/75 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        className="fixed z-[100] inset-0 m-auto flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="relative w-full max-w-md pointer-events-auto bg-black border border-orange-500/25 rounded-3xl overflow-hidden shadow-[0_0_60px_-10px_rgba(234,88,12,0.25)]">

                            {/* Ambient glow effects */}
                            <div className="absolute top-0 left-0 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 right-0 w-56 h-56 bg-red-700/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

                            {/* Top Header Stripe */}
                            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-3 flex items-center gap-3">
                                <div className="relative w-9 h-9 flex-shrink-0">
                                    <Image src="/logo.jpeg" alt="Culinora" fill className="object-contain rounded-lg" />
                                </div>
                                <div>
                                    <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Culinora</p>
                                    <p className="text-white font-bold text-sm leading-none">Premium Üyelik</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
                                    <Crown className="h-3 w-3 text-yellow-300" />
                                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Premium</span>
                                </div>
                                {/* Close Button integrated in header */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-shrink-0 ml-2 p-1.5 rounded-full bg-black/25 hover:bg-black/50 text-white transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 pt-6 pb-2">
                                {/* Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-full px-4 py-1.5 mb-4"
                                >
                                    <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                                    <span className="text-orange-400 font-semibold text-xs">Premium Üyelik Fırsatı</span>
                                </motion.div>

                                {/* Headline */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl font-bold text-white mb-2 leading-tight"
                                >
                                    Seni Bekleyen Eşsiz Deneyime{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                                        Hemen Başla!
                                    </span>
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="text-gray-400 text-sm mb-5 leading-relaxed"
                                >
                                    Tüm eğitimlere sınırsız erişim, premium içerikler ve çok daha fazlası!
                                </motion.p>

                                {/* Features */}
                                <div className="space-y-2.5 mb-6">
                                    {features.map(({ icon: Icon, text }, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.07 }}
                                            className="flex items-center gap-3 text-gray-300 text-sm"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                                <Icon className="h-3.5 w-3.5 text-orange-500" />
                                            </div>
                                            <span>{text}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Price Block */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex items-center gap-3 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/20 rounded-2xl px-4 py-3 mb-5"
                                >
                                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-white font-bold text-sm">Aylık Premium Plan</p>
                                        <p className="text-gray-400 text-xs">İstediğin zaman iptal edebilirsin</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-orange-400 font-black text-xl">299 ₺</p>
                                        <p className="text-gray-500 text-xs">/ay</p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* CTA Footer */}
                            <div className="px-6 pb-6 space-y-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <Link
                                        href="/subscription"
                                        onClick={() => setIsOpen(false)}
                                        className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white h-12 rounded-2xl font-bold text-sm transition-all shadow-[0_10px_30px_-10px_rgba(234,88,12,0.5)] active:scale-[0.98] overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            Hemen Abone Ol
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                        {/* Shimmer */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    </Link>
                                </motion.div>

                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    onClick={() => setIsOpen(false)}
                                    className="w-full text-gray-500 hover:text-gray-300 transition-colors py-1 text-xs font-medium uppercase tracking-widest"
                                >
                                    Sonra hatırlat
                                </motion.button>
                            </div>

                            {/* Bottom brand bar */}
                            <div className="border-t border-white/5 py-2.5 px-6 flex justify-center">
                                <p className="text-[10px] text-gray-700 uppercase tracking-[0.25em] font-bold">Culinora · Profesyonel Gastronomi Eğitimi</p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
