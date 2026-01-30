"use client";
import Link from "next/link";
import { ChefHat, Play, ArrowRight, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import UserDropdown from "@/components/ui/UserDropdown";
import HeaderSearch from "@/components/layout/HeaderSearch";
import { useRouter } from "next/navigation";
import Footer from "@/components/layout/Footer";
import AutoScrollCourses from "@/components/home/AutoScrollCourses";
import FAQSection from "@/components/home/FAQSection";
import { Crown } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    courseCount: number;
}

interface FeaturedCourse {
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl?: string | null;
    level: string;
    reviews: Array<{ rating: number }>;
    instructor: {
        name: string;
        image?: string;
    };
}

interface LandingPageProps {
    initialFeatured: FeaturedCourse[];
    initialCategories: Category[];
    initialUserCourses: any[];
}

export default function LandingPageClient({
    initialFeatured,
    initialCategories,
    initialUserCourses
}: LandingPageProps) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [showBrowseMenu, setShowBrowseMenu] = useState(false);
    const browseRef = useRef<HTMLDivElement>(null);

    // Close browse menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (browseRef.current && !browseRef.current.contains(event.target as Node)) {
                setShowBrowseMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignUpClick = () => {
        router.push("/auth/signup");
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Header - MasterClass Style */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800/50">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Left Side - Logo & Browse & Search */}
                        <div className="flex items-center gap-3">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2 mr-2">
                                <ChefHat className="h-7 w-7 text-orange-500" />
                                <span className="text-xl font-bold text-white">Culinora</span>
                            </Link>

                            {/* Browse Button with Dropdown */}
                            <div className="relative" ref={browseRef}>
                                <button
                                    onClick={() => setShowBrowseMenu(!showBrowseMenu)}
                                    className="hidden md:flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                                >
                                    Gözat
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showBrowseMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {showBrowseMenu && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gray-800">
                                            <span className="text-xs text-gray-500 tracking-wider">Kategoriler</span>
                                        </div>
                                        {initialCategories.map((cat) => (
                                            <Link
                                                key={cat.id}
                                                href={`/category/${cat.id}`}
                                                onClick={() => setShowBrowseMenu(false)}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2a2a2a] transition-colors text-left"
                                            >
                                                <span className="text-white text-sm">{cat.name}</span>
                                                <span className="text-gray-500 text-xs">{cat.courseCount} kurs</span>
                                            </Link>
                                        ))}
                                        <div className="border-t border-gray-800 mt-2 pt-2">
                                            <Link
                                                href="/courses"
                                                onClick={() => setShowBrowseMenu(false)}
                                                className="flex items-center justify-center gap-2 px-4 py-3 text-orange-500 hover:bg-[#2a2a2a] transition-colors text-sm font-medium"
                                            >
                                                Tüm Kursları Gör
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search Bar */}
                            <HeaderSearch />
                        </div>

                        {/* Right Side - Links & CTA */}
                        <div className="flex items-center">
                            {/* Nav Links with more spacing */}
                            <nav className="hidden lg:flex items-center gap-8 mr-8">
                                <Link href="/subscription" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Planlar
                                </Link>
                                <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Hakkımızda
                                </Link>
                            </nav>

                            {/* Divider */}
                            <div className="hidden lg:block w-px h-5 bg-gray-700 mr-6"></div>

                            {/* Auth Links */}
                            <div className="flex items-center gap-4">
                                {status === "loading" ? (
                                    <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse "></div>
                                ) : session ? (
                                    <UserDropdown />
                                ) : (
                                    <>
                                        <Link href="/auth/signin" className="text-gray-400 hover:text-white text-sm transition-colors">
                                            Giriş yap
                                        </Link>
                                        <Link
                                            href="/auth/signup"
                                            className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                                        >
                                            Kayıt Ol
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-12 relative z-20 overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black z-10"></div>

                    {/* Course Images Grid - Responsive: 3 cols mobile, 6 cols desktop */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-2 opacity-90">
                        {initialFeatured.length > 0 && initialFeatured.slice(0, 12).map((course, index) => (
                            <div key={index} className="aspect-square overflow-hidden">
                                <img
                                    src={course.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                        {/* Fill remaining slots if not enough courses */}
                        {initialFeatured.length < 12 && Array.from({ length: 12 - initialFeatured.length }).map((_, index) => (
                            <div key={`placeholder-${index}`} className="aspect-square overflow-hidden bg-gray-900">
                                <img
                                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80"
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Gastronomi Dünyasına
                            <span className="text-orange-500"> Yolculuk</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white md:text-gray-300 mb-8 max-w-3xl mx-auto font-medium md:font-normal">
                            Profesyonel şeflerden öğren, mutfakta ustalaş.
                            Video dersler, uygulamalı projeler ve sertifikalar ile gastronomi kariyerine başla.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleSignUpClick}
                                className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors relative z-40 cursor-pointer"
                            >
                                Hemen Başla
                            </button>
                            <button className="flex items-center justify-center space-x-2 border-2 border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:border-orange-500 hover:text-orange-500 transition-colors cursor-pointer">
                                <Play className="h-5 w-5" />
                                <span>Tanıtım Videosu</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Subscription Banner */}
            <section className="py-8 bg-gradient-to-br from-orange-900/20 via-black to-purple-900/20 border-y border-orange-500/20 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-5">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
                            Tüm Kurslara
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 ml-2">
                                Sınırsız Erişim!
                            </span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
                            Tek bir üyelikle mutfakta ustalığa giden yolda sınır tanımayın.
                        </p>
                    </div>

                    {/* Single Premium Plan - Compact Style */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-5xl px-4 md:px-0">
                            <div className="relative bg-black/40 backdrop-blur-md border border-orange-500/30 rounded-xl overflow-hidden shadow-lg shadow-orange-900/20">
                                <div className="flex flex-col md:flex-row items-center justify-between p-5 md:px-10 md:py-6 relative z-10">

                                    {/* Left Side: Title & Subtitle */}
                                    <div className="text-center md:text-left mb-5 md:mb-0">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                            <div className="bg-orange-600/20 p-2 rounded-lg">
                                                <Crown className="w-8 h-8 text-orange-500" />
                                            </div>
                                            <h3 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
                                                Premium
                                            </h3>
                                        </div>
                                        <p className="text-gray-400 font-light text-base pl-0.5">
                                            Culinora'daki Tüm Eğitimler!
                                        </p>
                                    </div>

                                    {/* Right Side: Price & Action */}
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                                        <div className="flex items-baseline gap-2 text-white">
                                            <span className="text-gray-500 text-sm line-through decoration-orange-600">399 ₺</span>
                                            <span className="text-gray-400 text-sm">yerine</span>
                                            <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">299 ₺</span>
                                            <span className="text-gray-400 text-sm font-light">/ Aylık</span>
                                        </div>

                                        <Link
                                            href="/subscription"
                                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-base font-bold py-2.5 px-8 rounded-lg transition-all transform hover:scale-105 shadow-md"
                                        >
                                            Üyeliğini Başlat
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>

                                </div>

                                {/* Visual Effects */}
                                <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-600/10 blur-3xl rounded-full pointer-events-none"></div>
                                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-orange-600/10 blur-3xl rounded-full pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Continue Watching Section */}
            {initialUserCourses.length > 0 && (
                <section className="py-8 bg-black">
                    <div className="max-w-[1400px] mx-auto px-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
                            <Play className="text-orange-500 w-6 h-6" fill="currentColor" />
                            Kaldığın Yerden Devam Et
                        </h2>
                        <div className="flex overflow-x-auto scrollbar-hide space-x-6 pb-4">
                            {initialUserCourses.map((course) => (
                                <Link key={course.id} href={`/course/${course.id}`} className="block group flex-shrink-0">
                                    <div className="w-[280px] md:w-[320px] relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-orange-500/30 transition-all duration-300">
                                        {/* Image */}
                                        <div className="aspect-video relative overflow-hidden">
                                            <img
                                                src={course.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                                            {/* Play Button Overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                                                    <Play className="w-6 h-6 text-white" fill="white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="text-white font-semibold text-lg line-clamp-1 mb-1">{course.title}</h3>
                                            <p className="text-gray-400 text-xs mb-3">{course.instructor?.name || 'Eğitmen'}</p>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-800 h-1.5 rounded-full mb-3 overflow-hidden">
                                                <div
                                                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${course.progress || 0}%` }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">%{course.progress || 0} Tamamlandı</span>
                                                <span className="text-orange-500 font-medium group-hover:underline">Devam Et</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}



            {/* Auto Scrolling Courses */}
            {initialFeatured.length > 0 && (
                <AutoScrollCourses courses={initialFeatured} />
            )}

            {/* FAQ Section */}
            <FAQSection />

            {/* Footer */}
            <Footer />
        </div>
    );
}
