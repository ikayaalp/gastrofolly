import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Culinora'nın misyonu, vizyonu ve ekibi. Gastronomi eğitimini demokratikleştiren platformumuzu tanıyın.",
}
import { ChefHat, Award, Target, Heart, Mail, Linkedin, Twitter } from "lucide-react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import UserDropdown from "@/components/ui/UserDropdown"
import Footer from "@/components/layout/Footer"

export default async function AboutPage() {
  const session = await getServerSession(authOptions)
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href={session?.user ? "/home" : "/"} className="flex items-center gap-0.5">
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
              {session?.user?.role === 'ADMIN' && (
                <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
              )}
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href={session?.user ? "/home" : "/"} className="text-gray-300 hover:text-orange-500">
                Ana Sayfa
              </Link>
              <Link href="/about" className="text-orange-500">
                Hakkımızda
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-orange-500">
                İletişim
              </Link>
              {session?.user && (
                <>
                  <Link href="/my-courses" className="text-gray-300 hover:text-orange-500">
                    Kurslarım
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <>
                      <Link href="/admin" className="text-gray-300 hover:text-orange-500">
                        Admin Paneli
                      </Link>
                      <Link href="/admin/courses" className="text-gray-300 hover:text-orange-500">
                        Kurs Yönetimi
                      </Link>
                    </>
                  )}
                  <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">
                    Culi
                  </Link>
                  <Link href="/chef-sosyal" className="text-gray-300 hover:text-orange-500">
                    Chef Sosyal
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <UserDropdown />
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Hakkımızda
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Culinora olarak gastronomi dünyasında yeni nesil eğitim deneyimi sunuyoruz.
              Amacımız, mutfak sanatını herkes için erişilebilir kılmak.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Misyonumuz</h3>
              <p className="text-gray-400">
                Gastronomi eğitimini demokratikleştirmek ve herkesin mutfak sanatını öğrenebileceği
                bir platform oluşturmak.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Vizyonumuz</h3>
              <p className="text-gray-400">
                Türkiye&apos;nin en büyük online gastronomi eğitim platformu olmak ve
                dünya çapında tanınan bir marka haline gelmek.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Değerlerimiz</h3>
              <p className="text-gray-400">
                Kalite, yenilikçilik, erişilebilirlik ve sürekli öğrenme
                ilkelerini benimser, öğrencilerimizin başarısını öncelik olarak görürüz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Co-Founders Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Kurucu Ortaklarımız
            </h2>
            <p className="text-gray-400">
              Culinora&apos;ı hayata geçiren vizyoner ekibimizle tanışın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* İsmail Kayaalp */}
            <div className="relative group bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20 rounded-xl p-6 text-center border-2 border-purple-500/30 hover:border-purple-500 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg group-hover:shadow-purple-500/50">
                <span className="text-3xl">👨‍💼</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">İbrahim Kayaalp</h3>
              <p className="text-orange-500 font-medium mb-3">Co-Founder & CEO</p>
              <p className="text-gray-400 text-sm mb-4">
                Teknoloji ve gastronomi alanında 10+ yıllık deneyime sahip.
                Platform&apos;un vizyonunu belirleme ve stratejik yönlendirme konularında liderlik ediyor.
              </p>
              <div className="flex justify-center space-x-3">
                <button className="text-gray-400 hover:text-orange-500">
                  <Mail className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-orange-500">
                  <Linkedin className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-orange-500">
                  <Twitter className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* İbrahim Kayaalp */}
            <div className="relative group bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20 rounded-xl p-6 text-center border-2 border-purple-500/30 hover:border-purple-500 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg group-hover:shadow-purple-500/50">
                <span className="text-3xl">👨‍💻</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">İsmail Kayaalp</h3>
              <p className="text-orange-500 font-medium mb-3">Co-Founder & CTO</p>
              <p className="text-gray-400 text-sm mb-4">
                Yazılım geliştirme ve sistem mimarisi konularında uzman.
                Platform&apos;un teknik altyapısını tasarlama ve geliştirme süreçlerini yönetiyor.
              </p>
              <div className="flex justify-center space-x-3">
                <button className="text-gray-400 hover:text-orange-500">
                  <Mail className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-orange-500">
                  <Linkedin className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-orange-500">
                  <Twitter className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Zeynep Berre Uçan Kayaalp */}
            <div className="relative group bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20 rounded-xl p-6 text-center border-2 border-purple-500/30 hover:border-purple-500 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg group-hover:shadow-purple-500/50">
                <span className="text-3xl">👩‍🍳</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Berre Zeynep Uçan Kayaalp</h3>
              <p className="text-orange-500 font-medium mb-3">Co-Founder & Head of Content</p>
              <p className="text-gray-400 text-sm mb-4">
                Gastronomi eğitimi ve içerik üretimi alanında uzman.
                Eğitim programlarının kalitesi ve eğitmen seçimi süreçlerini yönetiyor.
              </p>
              <div className="flex justify-center space-x-3">
                <button className="text-gray-400 hover:text-orange-500">
                  <Mail className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-orange-500">
                  <Linkedin className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-orange-500">
                  <Twitter className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">10,000+</div>
              <p className="text-gray-400">Mutlu Öğrenci</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">50+</div>
              <p className="text-gray-400">Video Kurs</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">25+</div>
              <p className="text-gray-400">Profesyonel Şef</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">4.9</div>
              <p className="text-gray-400">Ortalama Puan</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Gastronomi Yolculuğunuza Başlayın
          </h2>
          <p className="text-xl text-white mb-8">
            Profesyonel şeflerden öğrenin, becerilerinizi geliştirin ve mutfak sanatında ustalaşın.
          </p>
          <Link
            href="/auth/signup"
            className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-block"
          >
            Hemen Başla
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
