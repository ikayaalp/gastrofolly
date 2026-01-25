"use client";
import Link from "next/link";
import { ChefHat, Play, Star, Users, Crown, BookOpen, Zap, ArrowRight, Check, Search, ChevronDown, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import AutoScrollCourses from "@/components/home/AutoScrollCourses";
import HomeStories from "@/components/home/HomeStories";
import FAQSection from "@/components/home/FAQSection";
import HeaderSearch from "@/components/layout/HeaderSearch";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  courseCount: number;
}

interface CategoryCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  level: string;
  duration?: number;
  instructor: {
    id: string;
    name: string;
    image?: string;
  };
  lessonCount: number;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
}

export default function Home() {
  const router = useRouter();
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

  const [featured, setFeatured] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  // Default categories for fallback
  const defaultCategories: Category[] = [
    { id: "cat-1", name: "Türk Mutfağı", slug: "turk-mutfagi", courseCount: 12 },
    { id: "cat-2", name: "Pastacılık & Ekmekçilik", slug: "pastacilik", courseCount: 8 },
    { id: "cat-3", name: "İtalyan Mutfağı", slug: "italyan-mutfagi", courseCount: 10 },
    { id: "cat-4", name: "Asya Mutfağı", slug: "asya-mutfagi", courseCount: 6 },
    { id: "cat-5", name: "Kahvaltı & Brunch", slug: "kahvalti", courseCount: 5 },
    { id: "cat-6", name: "Sağlıklı Yaşam", slug: "saglikli-yasam", courseCount: 4 }
  ];

  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const browseRef = useRef<HTMLDivElement>(null);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        // Keep default categories if fetch fails
      }
    };
    fetchCategories();
  }, []);

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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses/featured");
        const data = await response.json();
        setFeatured(data.courses || []);
      } catch (error) {
        console.error("Error loading courses:", error);
        setFeatured([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleSignUpClick = () => {
    console.log("Hemen Başla butonuna tıklandı!");
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
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Kategoriler</span>
                    </div>
                    {categories.map((cat) => (
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
                <Link href="/auth/signin" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Giriş yap
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  Kayıt Ol
                </Link>
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
            {featured.length > 0 && featured.slice(0, 12).map((course, index) => (
              <div key={index} className="aspect-square overflow-hidden">
                <img
                  src={course.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {/* Fill remaining slots if not enough courses */}
            {featured.length < 12 && Array.from({ length: 12 - featured.length }).map((_, index) => (
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
                      <h3 className="text-3xl md:text-4xl font-bold text-white tracking-wide uppercase">
                        PREMIUM
                      </h3>
                    </div>
                    <p className="text-gray-400 font-light text-base pl-0.5">
                      Culinora'deki Tüm Eğitimler!
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

      {/* Stories Section (Mobile Only) */}
      <HomeStories />

      {/* Auto Scrolling Courses */}
      {featured.length > 0 && (
        <AutoScrollCourses courses={featured} />
      )}

      {/* FAQ Section */}
      <FAQSection />





      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Culinora</span>
              </div>
              <p className="text-gray-400">
                Gastronomi dünyasında kendinizi geliştirin ve profesyonel bir şef olun.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Kurslar</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Temel Mutfak</Link></li>
                <li><Link href="#" className="hover:text-white">Türk Mutfağı</Link></li>
                <li><Link href="#" className="hover:text-white">Pastane</Link></li>
                <li><Link href="#" className="hover:text-white">Dünya Mutfağı</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Şirket</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Hakkımızda</Link></li>
                <li><Link href="#" className="hover:text-white">Eğitmenler</Link></li>
                <li><Link href="#" className="hover:text-white">Kariyer</Link></li>
                <li><Link href="#" className="hover:text-white">İletişim</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Yardım Merkezi</Link></li>
                <li><Link href="#" className="hover:text-white">Gizlilik</Link></li>
                <li><Link href="#" className="hover:text-white">Şartlar</Link></li>
                <li><Link href="#" className="hover:text-white">SSS</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ChefAcademy. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
