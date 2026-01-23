"use client";
import Link from "next/link";
import { ChefHat, Play, Star, Users, Crown, BookOpen, Zap, ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import AutoScrollCourses from "@/components/home/AutoScrollCourses";
import HomeStories from "@/components/home/HomeStories";
import { useRouter } from "next/navigation";

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
  }

  const [featured, setFeatured] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklenince hemen fetch başlat
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black md:bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold text-white">Chef2.0</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-orange-500">
                Ana Sayfa
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-orange-500">
                Hakkımızda
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-orange-500">
                İletişim
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-300 hover:text-orange-500"
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/signup"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Kayıt Ol
              </Link>
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
      <section className="py-16 bg-gradient-to-br from-orange-900/20 via-black to-purple-900/20 border-y border-orange-500/20 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Tüm Kurslara
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                Sınırsız Erişim!
              </span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              Tek bir üyelikle mutfakta ustalığa giden yolda sınır tanımayın.
            </p>
          </div>

          {/* Single Premium Plan - Horizontal Redesign */}
          <div className="flex justify-center mb-12">
            <div className="relative w-full max-w-5xl bg-black/60 backdrop-blur-md border-2 border-orange-500 rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl shadow-orange-500/20 group hover:shadow-orange-500/30">

              <div className="flex flex-col md:flex-row">
                {/* Left Side: Brand & Price */}
                <div className="w-full md:w-2/5 md:border-r border-orange-500/30 bg-gradient-to-br from-orange-900/40 via-black to-black p-8 flex flex-col items-center justify-center relative relative">
                  <div className="absolute top-4 left-1/2 md:left-auto md:right-4 transform -translate-x-1/2 md:translate-x-0">
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-orange-600/30 animate-pulse">
                      EN POPÜLER
                    </div>
                  </div>

                  <div className="mb-6 mt-6 md:mt-0">
                    <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-full p-4 shadow-lg shadow-orange-600/30 inline-block">
                      <Crown className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-white text-center mb-2">Premium</h3>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-5xl font-bold text-white">299₺</span>
                    </div>
                    <p className="text-gray-400 font-medium">/ Aylık</p>
                  </div>
                </div>

                {/* Right Side: Features & CTA */}
                <div className="w-full md:w-3/5 p-8 flex flex-col justify-between bg-black/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {[
                      "Tüm kurslara sınırsız erişim",
                      "Yeni içeriklere anında erişim",
                      "Premium topluluk erişimi",
                      "Eğitmenlerle doğrudan iletişim",
                      "Sertifika desteği",
                      "Mobil ve masaüstü erişim"
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                        <span className="text-gray-200 text-sm md:text-base">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/subscription"
                      className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2 group"
                    >
                      Hemen Başla
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
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

      {/* Stats Section */}
      <section className="mt-6 py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">10,000+</h3>
              <p className="text-gray-300">Mutlu Öğrenci</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">50+</h3>
              <p className="text-gray-300">Video Kurs</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">4.9</h3>
              <p className="text-gray-300">Ortalama Puan</p>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
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
