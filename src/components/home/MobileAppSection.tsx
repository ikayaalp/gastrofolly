"use client";
import { motion } from "framer-motion";
import { Apple, Play as PlayIcon, Smartphone, Youtube, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function MobileAppSection() {
    return (
        <section className="py-24 bg-black border-t border-gray-800 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Visuals - Phone Mockups */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative flex justify-center lg:justify-start pt-12 lg:pt-0"
                    >
                        {/* Device 1 (Behind) */}
                        <div className="relative w-[240px] h-[480px] bg-[#1a1a1a] rounded-[40px] border-[8px] border-[#2a2a2a] shadow-2xl transform -rotate-12 translate-x-8 translate-y-4 hidden md:block opacity-40">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2a2a2a] rounded-b-2xl" />
                        </div>

                        {/* Device 2 (Front) */}
                        <div className="relative w-[280px] h-[560px] bg-[#111111] rounded-[45px] border-[10px] border-[#222222] shadow-2xl shadow-orange-500/10 z-10 transition-transform hover:scale-105 duration-500">
                            {/* Screen Content Wrapper */}
                            <div className="w-full h-full rounded-[35px] overflow-hidden relative">
                                <Image
                                    src="/logo.jpeg"
                                    alt="Culinora App"
                                    fill
                                    className="object-cover opacity-20"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black flex flex-col items-center justify-center p-8">
                                    <div className="w-20 h-20 relative mb-6">
                                        <Image src="/logo.jpeg" alt="Culinora" fill className="object-contain rounded-2xl" />
                                    </div>
                                    <h3 className="text-white text-2xl font-bold text-center mb-2">Culinora</h3>
                                    <p className="text-gray-400 text-sm text-center">Mutfaktaki Yeni Yol Arkadaşın</p>

                                    <div className="mt-12 space-y-4 w-full">
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-600 w-2/3" />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                                            <span>Sıradaki: İtalyan Makarnaları</span>
                                            <span>%65</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#222222] rounded-b-2xl z-20" />
                        </div>


                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                            Mutfakta Her An <span className="text-orange-500">Yanınızda</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-12 leading-relaxed">
                            Culinora mobil uygulaması ile eğitimlerinizi yanınıza alın. Mutfakta tezgah başında, internetin çekmediği anlarda derslerinizi kesintisiz takip edin.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* App Store Button */}
                            <button className="flex items-center gap-3 bg-black border border-[#A6A6A6]/30 rounded-2xl px-5 py-3 hover:bg-white/5 transition-all w-[220px] h-[64px]">
                                <svg viewBox="0 0 384 512" className="w-8 h-8 fill-white flex-shrink-0">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                </svg>
                                <div className="text-left">
                                    <p className="text-white text-sm leading-tight">App Store'dan</p>
                                    <p className="text-white text-xs text-gray-400 leading-tight">İndirin</p>
                                </div>
                            </button>

                            {/* Google Button */}
                            <button className="flex items-center gap-3 bg-black border border-[#A6A6A6]/30 rounded-2xl px-5 py-3 hover:bg-white/5 transition-all w-[220px] h-[64px]">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0">
                                    <path fill="#4285F4" d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594z" />
                                    <path fill="#34A853" d="M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.112.568l11.075-11.052L1.337.924z" />
                                    <path fill="#FBBC04" d="M14.584 12.023l3.515 3.493-12.842 7.278a1.474 1.474 0 0 1-1.92-.27l11.247-10.501z" />
                                    <path fill="#EA4335" d="M14.584 12.023L3.337.924a1.474 1.474 0 0 1 1.92-.266l12.842 7.365-3.515 3.5z" />
                                </svg>
                                <div className="text-left">
                                    <p className="text-white text-sm leading-tight">Google Play</p>
                                    <p className="text-white text-xs text-gray-400 leading-tight">'DEN ALIN</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
