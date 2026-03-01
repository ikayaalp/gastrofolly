"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Instructor {
    id: string;
    name: string;
    image?: string | null;
}

interface InstructorsSectionProps {
    instructors: Instructor[];
    speed?: number;
    intervalMs?: number;
}

export default function InstructorsSection({ instructors, speed = 1, intervalMs = 16 }: InstructorsSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHover, setIsHover] = useState(false);

    // Duplicate the instructors to create a seamless infinite loop
    const displayInstructors = [...instructors, ...instructors, ...instructors];

    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;

        const timer = setInterval(() => {
            if (isHover) return;
            if (!el) return;

            const cardWidth = 320 + 32; // card width + margin (md scale)
            const totalWidthOfOneSet = instructors.length * cardWidth;

            // When we scroll past the first set, jump back to start of first set seamlessly
            if (el.scrollLeft >= totalWidthOfOneSet) {
                el.scrollLeft -= totalWidthOfOneSet;
            }

            el.scrollLeft += speed;
        }, intervalMs);

        return () => clearInterval(timer);
    }, [isHover, speed, intervalMs, instructors.length]);

    if (!instructors || instructors.length === 0) return null;

    return (
        <section className="py-24 bg-black border-t border-gray-800 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <div className="max-w-2xl">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Profesyonel <span className="text-orange-500">Şeflerimizle</span> Tanışın
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Michelin yıldızlı profesyonellerden, dünya mutfağı uzmanlarından ve modern gastronomi dünyasının usta isimlerinden öğrenmeye başlayın.
                    </p>
                </div>
            </div>

            {/* Horizontal Scrolling Strip */}
            <div
                ref={containerRef}
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
                className="flex overflow-x-auto scrollbar-hide space-x-6 md:space-x-8 py-4 px-6 md:px-[calc((100vw-1280px)/2)] w-full antialiased"
                style={{ scrollBehavior: 'auto' }}
            >
                {displayInstructors.map((instructor, idx) => (
                    <div
                        key={`${instructor.id}-${idx}`}
                        className="min-w-[260px] w-[260px] md:min-w-[320px] md:w-[320px] group relative flex-shrink-0"
                    >
                        <div className="aspect-[4/5] relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 group-hover:border-orange-500/50 transition-all duration-500 shadow-xl group-hover:shadow-orange-900/10">
                            <img
                                src={instructor.image || "/default-avatar.png"}
                                alt={instructor.name}
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />

                            <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="w-6 h-[1px] bg-orange-500"></span>
                                    <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest">Usta Eğitmen</p>
                                </div>
                                <h3 className="text-white font-bold text-xl md:text-2xl mb-1 truncate group-hover:text-orange-50 transition-colors">
                                    {instructor.name}
                                </h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
