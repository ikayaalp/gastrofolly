"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface Instructor {
    id: string;
    name: string;
    image?: string | null;
}

interface InstructorsSectionProps {
    instructors: Instructor[];
}

export default function InstructorsSection({ instructors }: InstructorsSectionProps) {
    return (
        <section className="py-24 bg-black border-t border-gray-800 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Profesyonel <span className="text-orange-500">Şeflerimizle</span> Tanışın
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Michelin yıldızlı mutfaklardan, ödüllü pastanelerden ve gastronomi dünyasının zirvesinden gelen uzmanlarla öğrenmeye başlayın.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {instructors.map((instructor, index) => (
                        <motion.div
                            key={instructor.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group relative"
                        >
                            <div className="aspect-[4/5] relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 group-hover:border-orange-500/50 transition-colors">
                                <img
                                    src={instructor.image || "/default-avatar.png"}
                                    alt={instructor.name}
                                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110 active:scale-95 grayscale-0 group-hover:grayscale-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <h3 className="text-white font-bold text-lg md:text-xl mb-1 truncate">
                                        {instructor.name}
                                    </h3>
                                    <span className="text-orange-500 text-sm font-medium">Usta Eğitmen</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* View All Card */}
                    {instructors.length >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            viewport={{ once: true }}
                            className="group"
                        >
                            <Link
                                href="/instructors"
                                className="aspect-[4/5] relative overflow-hidden rounded-2xl bg-gray-900/40 border border-dashed border-gray-700 hover:border-orange-500/50 flex flex-col items-center justify-center gap-4 transition-all group-hover:bg-gray-800/40"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-500 transition-all">
                                    <ArrowRight className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-gray-300 font-medium group-hover:text-white transition-colors">Tüm Şefleri Gör</span>
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}
