"use client";

import Image from "next/image";
import Link from "next/link";
import { ChefHat, Play, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import AutoScrollCourses from "@/components/home/AutoScrollCourses";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Array<any>>([]);

  useEffect(() => {
    fetch("/api/courses/featured")
      .then((r) => r.json())
      .then((d) => setFeatured(d.courses || []))
      .catch(() => setFeatured([]));
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
      <section className="pt-32 pb-24 relative z-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Auto Scrolling Courses */}
      {featured.length > 0 && (
        <AutoScrollCourses courses={featured} />
      )}

      {/* Stats Section */}
      <section className="py-16 bg-gray-900">
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

      {/* Featured Courses */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Popüler Kurslar
            </h2>
            <p className="text-gray-300">
              En çok tercih edilen gastronomi kurslarımızı keşfedin
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Course Card 1 */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all">
              <div className="h-48 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80')"}}></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Temel Mutfak Teknikleri
                </h3>
                <p className="text-gray-300 mb-4">
                  Mutfakta başarılı olmak için bilmeniz gereken temel teknikleri öğrenin.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-500">₺299</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-400">4.8 (124)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Card 2 */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all">
              <div className="h-48 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80')"}}></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Türk Mutfağı Klasikleri
                </h3>
                <p className="text-gray-300 mb-4">
                  Türk mutfağının en sevilen yemeklerini profesyonel şeflerden öğrenin.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-500">₺399</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-400">4.9 (89)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Card 3 */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all">
              <div className="h-48 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80')"}}></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Pastane Sanatı
                </h3>
                <p className="text-gray-300 mb-4">
                  Pasta, kurabiye ve tatlı yapımının inceliklerini keşfedin.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-500">₺499</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-400">4.7 (156)</span>
                  </div>
                </div>
              </div>
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
