"use client";
import Link from "next/link";
import { ChefHat, Play, Star, Users, Crown, BookOpen, Zap, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import AutoScrollCourses from "@/components/home/AutoScrollCourses";
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black z-10"></div>

          {/* Course Images Grid */}
          <div className="grid grid-cols-6 grid-rows-2 gap-2 opacity-60">
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
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
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
      <section className="py-12 bg-gradient-to-br from-orange-900/20 via-black to-purple-900/20 border-y border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Tüm Kurslara
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">
                Sınırsız Erişim!
              </span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              Size en uygun paketi seçin ve gastronomi dünyasında ustalaşın
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Commis Plan */}
            <div className="relative bg-black/40 backdrop-blur-sm border-2 border-gray-500/50 rounded-xl p-6 transition-all duration-300 hover:scale-105">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-full p-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Commis</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-white">199₺</div>
                <p className="text-gray-400 text-sm">/ Aylık</p>
              </div>
            </div>

            {/* Chef D party Plan - Popular */}
            <div className="relative bg-black/40 backdrop-blur-sm border-2 border-orange-500/50 rounded-xl p-6 transition-all duration-300 md:scale-105 hover:scale-110 shadow-xl shadow-orange-500/20">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  EN POPÜLER
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-full p-3">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Chef D party</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-white">399₺</div>
                <p className="text-gray-400 text-sm">/ Aylık</p>
              </div>
            </div>

            {/* Executive Plan */}
            <div className="relative bg-black/40 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl p-6 transition-all duration-300 hover:scale-105">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-full p-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Executive</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-white">599₺</div>
                <p className="text-gray-400 text-sm">/ Aylık</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/50"
            >
              Tüm Paketleri İncele
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

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
      <footer className="bg-gray-900 text-white py-12">
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
