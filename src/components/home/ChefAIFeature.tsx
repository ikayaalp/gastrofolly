"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles, MessageSquare, BookOpen, Clock } from "lucide-react";

export default function ChefAIFeature() {
    return (
        <section className="py-24 bg-gradient-to-b from-black to-[#0a0a0a] border-t border-gray-800 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-orange-500 text-sm font-semibold mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>Yeni Nesil Mutfak Teknolojisi</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                            Mutfaktaki <span className="text-orange-500">Yapay Zeka</span> Asistanınız
                        </h2>
                        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                            Culinora Premium ile sadece videoları izlemezsiniz, kişisel şef asistanınızla etkileşime geçersiniz. Aklınıza takılan her şeyi 7/24 sorun, anında yanıt alın.
                        </p>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                                    <MessageSquare className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg mb-1">Anlık Tarif Soruları</h4>
                                    <p className="text-gray-400">"Sosun kıvamı çok koyu oldu, nasıl açabilirim?" gibi teknik sorularınıza saniyeler içinde cevap alın.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                                    <BookOpen className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg mb-1">Kişiselleştirilmiş Menü Planlama</h4>
                                    <p className="text-gray-400">Eldeki malzemeleri söyleyin, şef asistanınız size profesyonel bir akşam yemeği menüsü oluştursun.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                                    <Clock className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg mb-1">7/24 Aktif Şef Bilgisi</h4>
                                    <p className="text-gray-400">Dünya mutfağı tekniklerinden gizli şef sırlarına kadar her an ulaşılabilir kapsamlı gastronomi kütüphanesi.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mockup Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative aspect-square rounded-3xl overflow-hidden border border-gray-800 shadow-2xl shadow-orange-500/10">
                            <Image
                                src="/chef_ai_mockup_1772374604485.png"
                                alt="Chef AI Assistant Interface"
                                fill
                                className="object-cover"
                            />
                            {/* Floating UI Elements Decor */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-black/60 to-transparent" />
                        </div>

                        {/* Decorative floating badges */}
                        <div className="absolute -top-6 -right-6 bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl shadow-xl hidden md:block">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-white font-medium text-sm">AI Şef Aktif</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
