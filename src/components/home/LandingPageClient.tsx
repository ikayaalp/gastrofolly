"use client";
import Link from "next/link";
import Image from "next/image";
import { ChefHat, Play, ArrowRight, ChevronDown, User, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import UserDropdown from "@/components/ui/UserDropdown";
import HeaderSearch from "@/components/layout/HeaderSearch";
import { useRouter } from "next/navigation";
import Footer from "@/components/layout/Footer";
import AutoScrollCourses from "@/components/home/AutoScrollCourses";
import FAQSection from "@/components/home/FAQSection";
import { Sparkles, Award, BookOpen, Smartphone, RefreshCw } from "lucide-react";
import InstructorsSection from "@/components/home/InstructorsSection";
import MobileAppSection from "@/components/home/MobileAppSection";

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
    instructor: {
        name: string;
        image?: string;
    };
}

interface Instructor {
    id: string;
    name: string;
    image?: string | null;
}

interface LandingPageProps {
    initialFeatured: FeaturedCourse[];
    initialCategories: Category[];

    initialInstructors: Instructor[];
    monthlyPrice?: number;
}

export default function LandingPageClient({
    initialFeatured,
    initialCategories,

    initialInstructors,
    monthlyPrice = 399
}: LandingPageProps) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [showBrowseMenu, setShowBrowseMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
                        {/* Left Side - Mobile Menu, Desktop Browse & Search */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-1">
                            {/* Mobile Menu Button - Left Aligned */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            {/* Browse Button with Dropdown (Desktop Only) */}
                            <div className="relative hidden lg:block" ref={browseRef}>
                                <button
                                    onClick={() => setShowBrowseMenu(!showBrowseMenu)}
                                    className="flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
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

                            {/* Search Bar - Hidden on very small screens, visible on md+ */}
                            <div className="hidden md:block">
                                <HeaderSearch />
                            </div>
                        </div>

                        {/* Center - Logo */}
                        <div className="flex justify-center md:flex-1 pl-2 sm:pl-0">
                            <Link href="/" className="flex items-center gap-0.5 mx-auto">
                                <div className="relative w-10 h-10">
                                    <Image
                                        src="/logo.png"
                                        alt="C"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-2xl font-bold tracking-tight">
                                    <span className="text-orange-500" style={{ marginLeft: "-6px" }}>ulin</span><span className="text-white" style={{ marginLeft: "0px" }}>ora</span>
                                </span>
                            </Link>
                        </div>

                        {/* Right Side - Links & CTA */}
                        <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1">
                            {/* Nav Links with more spacing (Desktop Only) */}
                            <nav className="hidden lg:flex items-center gap-8 mr-4">
                                <Link href="/subscription" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Planlar
                                </Link>
                                <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Hakkımızda
                                </Link>
                            </nav>

                            {/* Divider (Desktop Only) */}
                            <div className="hidden lg:block w-px h-5 bg-gray-700 mx-2"></div>

                            {/* Auth Links / User Profile */}
                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                {status === "loading" ? (
                                    <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse "></div>
                                ) : session ? (
                                    <UserDropdown />
                                ) : (
                                    <>
                                        <div className="hidden lg:flex items-center gap-4">
                                            <Link href="/auth/signin" className="text-gray-400 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                                                Giriş yap
                                            </Link>
                                            <Link
                                                href="/auth/signup"
                                                className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                Kayıt Ol
                                            </Link>
                                        </div>
                                        <Link href="/auth/signin" className="lg:hidden text-gray-400 hover:text-white p-2">
                                            <User className="w-6 h-6" />
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <div className={`fixed inset-0 z-[60] transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                <div className="absolute top-0 left-0 bottom-0 w-64 bg-[#121212] border-r border-gray-800 shadow-2xl flex flex-col">
                    <div className="p-4 border-b border-gray-800 flex justify-end">
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto py-4 px-6 flex flex-col gap-6">
                        <Link href="/subscription" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white hover:text-orange-500 transition-colors">Planlar</Link>
                        <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white hover:text-orange-500 transition-colors">Hakkımızda</Link>

                        <Link href="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white hover:text-orange-500 transition-colors">
                            Tüm Kursları Gör
                        </Link>

                        <div className="border-t border-gray-800 my-2" />

                        {!session && (
                            <div className="flex flex-col gap-3">
                                <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center border border-gray-600 text-white font-medium py-3 rounded-lg hover:border-gray-500 transition-colors">
                                    Giriş Yap
                                </Link>
                                <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center bg-orange-600 text-white font-medium py-3 rounded-lg hover:bg-orange-700 transition-colors">
                                    Kayıt Ol
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cinematic Hero */}
            <section className="relative min-h-[85vh] md:min-h-screen flex items-center pt-16">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&q=80"
                        alt="Hero background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
                    <div className="max-w-2xl">
                        <span className="text-orange-500 text-xs md:text-sm tracking-[0.2em] font-semibold uppercase mb-4 block">
                            TÜRKİYE'NİN GASTRONOMİ PLATFORMU
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.05]">
                            Ustalardan öğren.<br/>
                            Mutfakta <span className="text-orange-500">ustalaş</span>.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
                            Profesyonel şeflerden öğren... sertifikalar ile gastronomi kariyerine başla.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <button
                                onClick={handleSignUpClick}
                                className="bg-orange-600 text-white px-10 py-4 text-lg rounded-lg font-semibold hover:bg-orange-700 transition-colors cursor-pointer"
                            >
                                Hemen Başla
                            </button>
                            <span className="text-sm text-gray-400">
                                Aylık {monthlyPrice} ₺ — istediğin zaman iptal et
                            </span>
                        </div>
                    </div>
                </div>

                {/* Categories Pill Strip */}
                <div className="absolute bottom-8 left-0 right-0 z-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
                            {initialCategories.map((cat) => (
                                <Link 
                                    key={cat.id} 
                                    href={`/category/${cat.id}`}
                                    className="whitespace-nowrap border border-gray-700 hover:border-orange-500 rounded-full px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Proposition Strip */}
            <section className="border-y border-gray-900 py-8 bg-black relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <Play className="w-6 h-6 text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-gray-300">100+ ders videosu</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Award className="w-6 h-6 text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-gray-300">Bitirme sertifikası</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-6 h-6 text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-gray-300">Mobil uygulama</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <RefreshCw className="w-6 h-6 text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-gray-300">Her ay yeni içerik</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Auto Scrolling Courses */}
            {initialFeatured.length > 0 && (
                <AutoScrollCourses courses={initialFeatured} />
            )}

            {/* Meet the Chefs Section */}
            <InstructorsSection instructors={initialInstructors} />

            {/* Subscription Banner */}
            <section className="py-8 bg-black mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-5">
                        <span className="text-orange-500 text-xs tracking-[0.2em] font-semibold uppercase mb-2 block">
                            ÜYELİK
                        </span>
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
                            <div className="relative bg-black border border-orange-500/20 rounded-2xl overflow-hidden">
                                <div className="flex flex-col md:flex-row items-center justify-between p-5 md:px-10 md:py-6 relative z-10">

                                    {/* Left Side: Title & Subtitle */}
                                    <div className="text-center md:text-left mb-5 md:mb-0">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
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
                                            <span className="text-gray-500 text-sm line-through decoration-orange-600">{Math.round(monthlyPrice * 1.25)} ₺</span>
                                            <span className="text-gray-400 text-sm">yerine</span>
                                            <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{monthlyPrice} ₺</span>
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
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile App Showcase Section */}
            <MobileAppSection />

            {/* FAQ Section */}
            <FAQSection />

            {/* Footer */}
            <Footer />
        </div>
    );
}
