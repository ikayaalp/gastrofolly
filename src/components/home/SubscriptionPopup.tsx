"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Crown, Sparkles, Check, ArrowRight } from "lucide-react"
import Link from "next/link"

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
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-orange-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(249,115,22,0.3)]"
                    >
                        {/* Dekoratif Efektler */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-500/10 blur-3xl rounded-full" />
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-orange-600/10 blur-3xl rounded-full" />

                        {/* Kapat Butonu */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="p-8 md:p-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-orange-500/20 p-2 rounded-xl">
                                    <Crown className="h-7 w-7 text-orange-500" />
                                </div>
                                <div className="bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 text-xs font-bold text-orange-400 flex items-center gap-1 uppercase tracking-wider">
                                    <Sparkles className="h-3 w-3" />
                                    Premium Fırsatı
                                </div>
                            </div>

                            <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
                                Mutfak Sanatlarında <span className="text-orange-500">Sınır Tanıma!</span>
                            </h2>

                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Şeflerin dünyasına tam erişim sağla. Premium ile tüm kurslara, özel canlı yayınlara ve sertifika programlarına hemen başla.
                            </p>

                            <div className="space-y-4 mb-8">
                                {[
                                    "80+ Profesyonel Şef Kursu",
                                    "Yeni Eklenen Derslere Erken Erişim",
                                    "Şeflerle Birebir Soru-Cevap",
                                    "Resmi Tamamlama Sertifikaları"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-300">
                                        <div className="flex-shrink-0 w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center">
                                            <Check className="h-3 w-3 text-orange-500" />
                                        </div>
                                        <span className="font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-4">
                                <Link
                                    href="/subscription?plan=Premium"
                                    onClick={() => setIsOpen(false)}
                                    className="group flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_10px_20px_-10px_rgba(249,115,22,0.5)] active:scale-95"
                                >
                                    Şimdi Abone Ol
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-gray-300 font-semibold transition-colors py-2 text-sm"
                                >
                                    Belki daha sonra, keşfetmeye devam et
                                </button>
                            </div>
                        </div>

                        {/* Küçük Bilgilendirme */}
                        <div className="bg-white/5 py-3 px-8 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 text-center uppercase tracking-[0.2em] font-bold">
                                Culinora • Profesyonel Gastronomi Eğitimi
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
