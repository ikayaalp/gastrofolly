import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "İletişim",
  description: "Culinora ile iletişime geçin. Sorularınız, önerileriniz veya işbirliği teklifleriniz için bize ulaşın.",
}
import { ChefHat, Mail, Phone, Clock, MapPin, Send, Headphones, Building2, Globe, Home, BookOpen, Users, MessageCircle } from "lucide-react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import UserDropdown from "@/components/ui/UserDropdown"
import Footer from "@/components/layout/Footer"

export default async function ContactPage() {
  const session = await getServerSession(authOptions)
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {session?.user ? (
              <div className="flex items-center space-x-8">
                <Link href="/home" className="flex items-center gap-1.5">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/logo.jpeg"
                      alt="C"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-2xl font-bold tracking-tight">
                    <span className="text-orange-500">ulin</span>
                    <span className="text-white">ora</span>
                  </span>
                  {session.user.role === 'ADMIN' && (
                    <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                  )}
                </Link>
                <nav className="flex space-x-6">
                  <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                    Ana Sayfa
                  </Link>
                  <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                    Kurslarım
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <>
                      <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                        Admin Paneli
                      </Link>
                      <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                        Kurs Yönetimi
                      </Link>
                    </>
                  )}
                  <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                    Chef Sosyal
                  </Link>
                  <Link href="/contact" className="text-white font-semibold">
                    İletişim
                  </Link>
                </nav>
              </div>
            ) : (
              <>
                <Link href="/" className="flex items-center gap-1.5">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/logo.jpeg"
                      alt="C"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-2xl font-bold tracking-tight">
                    <span className="text-orange-500">ulin</span>
                    <span className="text-white">ora</span>
                  </span>
                </Link>
                <nav className="hidden md:flex space-x-8">
                  <Link href="/" className="text-gray-300 hover:text-orange-500">
                    Ana Sayfa
                  </Link>
                  <Link href="/about" className="text-gray-300 hover:text-orange-500">
                    Hakkımızda
                  </Link>
                  <Link href="/contact" className="text-orange-500">
                    İletişim
                  </Link>
                </nav>
              </>
            )}

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

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center gap-1.5">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.jpeg"
                alt="C"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-orange-500">ulin</span>
              <span className="text-white">ora</span>
            </span>
          </Link>
          <UserDropdown />
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-20 md:pt-32 pb-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <Headphones className="h-4 w-4 text-orange-500" />
              <span className="text-orange-400 text-sm font-medium">7/24 Destek</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Bizimle İletişime Geçin
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Sorularınız, önerileriniz veya işbirliği teklifleriniz için bize ulaşın.
              Ekibimiz en kısa sürede size dönüş yapacaktır.
            </p>
          </div>
        </div>
      </section>

      {/* İletişim Kartları */}
      <section className="py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Telefon */}
            <div className="bg-black border border-gray-800 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors">
                <Phone className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Telefon</h3>
              <p className="text-gray-400 text-sm">Pazartesi - Cuma, 09:00 - 18:00</p>
            </div>

            {/* E-posta */}
            <div className="bg-black border border-gray-800 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors">
                <Mail className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">E-posta</h3>
              <p className="text-gray-400 text-sm mb-4">24 saat içinde yanıt</p>
              <a href="mailto:info@gastrofolly.com" className="text-orange-500 hover:text-orange-400 font-semibold">
                info@gastrofolly.com
              </a>
              <br />
              <a href="mailto:destek@gastrofolly.com" className="text-gray-400 hover:text-gray-300 text-sm">
                destek@gastrofolly.com
              </a>
            </div>

            {/* Adres */}
            <div className="bg-black border border-gray-800 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 group">
              <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors">
                <MapPin className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Adres</h3>
              <p className="text-gray-400 text-sm">İstanbul, Türkiye</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ana İletişim Bölümü */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Sol - İletişim Formu */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Mesaj Gönderin</h2>
              <p className="text-gray-400 mb-8">Formu doldurun, size en kısa sürede dönelim.</p>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                      Ad *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      placeholder="Adınız"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      placeholder="+90 (5xx) xxx xx xx"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Konu *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  >
                    <option value="">Konu seçin</option>
                    <option value="general">Genel Bilgi</option>
                    <option value="support">Teknik Destek</option>
                    <option value="billing">Ödeme ve Faturalandırma</option>
                    <option value="partnership">İş Birliği Teklifi</option>
                    <option value="feedback">Geri Bildirim</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Mesajınız *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-colors"
                    placeholder="Mesajınızı detaylı bir şekilde yazın..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  <Send className="h-5 w-5" />
                  Mesajı Gönder
                </button>
              </form>
            </div>

            {/* Sağ - İletişim Bilgileri */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">İletişim Bilgileri</h2>
              <p className="text-gray-400 mb-8">Size en kısa sürede dönüş yapacağız</p>

              <div className="space-y-8">


                {/* Çalışma Saatleri */}
                <div className="bg-black border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-500/10 p-3 rounded-xl">
                      <Clock className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Çalışma Saatleri</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pazartesi - Cuma</span>
                          <span className="text-white font-medium">09:00 - 18:00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cumartesi</span>
                          <span className="text-white font-medium">10:00 - 14:00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pazar</span>
                          <span className="text-gray-500">Kapalı</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sosyal Medya */}
                <div className="bg-black border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-500/10 p-3 rounded-xl">
                      <Globe className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Sosyal Medya</h4>
                      <div className="flex gap-4">
                        <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </a>
                        <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                          </svg>
                        </a>
                        <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      <Footer />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Sosyal</span>
          </Link>
          <Link href="/chef-sor" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef&apos;e Sor</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
