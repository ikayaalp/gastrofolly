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
                            Culinora mobil uygulaması ile eğitimlerinizi yanınıza alın. Mutfakta tezgah başında, pazarda alışveriş yaparken veya internetin çekmediği anlarda derslerinizi kesintisiz takip edin.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* App Store Button */}
                            <button className="flex items-center gap-3 bg-black border border-gray-600 rounded-xl px-4 py-2 hover:bg-white/5 transition-colors w-full sm:w-auto">
                                <Apple className="w-8 h-8 text-white fill-current" />
                                <div className="text-left text-white leading-tight">
                                    <p className="text-[10px] font-medium">App Store'dan</p>
                                    <p className="text-xl font-semibold -mt-0.5">İndirin</p>
                                </div>
                            </button>

                            {/* Google Play Button */}
                            <button className="flex items-center gap-3 bg-black border border-gray-600 rounded-xl px-4 py-2 hover:bg-white/5 transition-colors w-full sm:w-auto">
                                <svg viewBox="0 0 512 512" className="w-8 h-8">
                                    <path fill="#4DB6AC" d="M12 50l253 254L12 558z" transform="scale(.8) translate(40 40)" />
                                    <path fill="#D32F2F" d="M12 50l253 254L505 50z" transform="scale(.8) translate(40 40)" />
                                    <path fill="#FBC02D" d="M505 50l-240 254L505 558z" transform="scale(.8) translate(40 40)" />
                                    <path fill="#1976D2" d="M12 558l253-254 240 254z" transform="scale(.8) translate(40 40)" />
                                </svg>
                                <div className="text-left text-white leading-tight">
                                    <p className="text-[10px] font-medium uppercase tracking-tighter">Google Play</p>
                                    <p className="text-xl font-semibold -mt-0.5 whitespace-nowrap">'DEN ALIN</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
