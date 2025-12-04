import Link from "next/link"
import { ChefHat, Mail, Phone, Clock, AlertCircle, Search, Bell, Home, BookOpen, Users, MessageCircle } from "lucide-react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import UserDropdown from "@/components/ui/UserDropdown"

export default async function ContactPage() {
  const session = await getServerSession(authOptions)
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {session?.user ? (
              // Giriş yapmış kullanıcı için: Logo + Navigation solda
              <div className="flex items-center space-x-8">
                <Link href="/home" className="flex items-center space-x-2">
                  <ChefHat className="h-8 w-8 text-orange-500" />
                  <span className="text-2xl font-bold text-white">Chef2.0</span>
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
                  <Link href="/chef-sor" className="text-gray-300 hover:text-white transition-colors">
                    Chef'e Sor
                  </Link>
                  <Link href="/contact" className="text-white font-semibold">
                    İletişim
                  </Link>
                </nav>
              </div>
            ) : (
              // Giriş yapmamış kullanıcı için: Logo solda
              <>
                <Link href="/" className="flex items-center space-x-2">
                  <ChefHat className="h-8 w-8 text-orange-500" />
                  <span className="text-2xl font-bold text-white">Chef2.0</span>
                </Link>
                {/* Navigation ortada */}
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
                <>
                  <button className="text-gray-300 hover:text-white transition-colors">
                    <Search className="h-5 w-5" />
                  </button>
                  <button className="text-gray-300 hover:text-white">
                    <Bell className="h-5 w-5" />
                  </button>
                  <UserDropdown />
                </>
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
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
          </Link>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-300 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 md:pt-32 pb-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              İletişim
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Sorularınız mı var? Size yardımcı olmaktan mutluluk duyarız.
            </p>
          </div>
        </div>
      </section>

      {/* Test Uyarısı */}
      <section className="py-8 bg-orange-900/20 border-y border-orange-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-3">
            <AlertCircle className="h-6 w-6 text-orange-400" />
            <p className="text-orange-200 text-center">
              <span className="font-semibold">Test esnasında bir sorunla karşılaşırsanız</span>
              <br />
              <span className="text-lg font-bold">İsmail Kayaalp ile iletişime geçiniz: </span>
              <a href="tel:05352509333" className="text-orange-400 hover:text-orange-300 font-bold">
                0535 250 93 33
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* İletişim Bilgileri */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* İletişim Bilgileri */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                İletişim Bilgileri
              </h2>

              <div className="space-y-6">
                {/* Telefon */}
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500/20 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Telefon</h3>
                    <p className="text-gray-300">Test desteği için</p>
                    <a
                      href="tel:05352509333"
                      className="text-orange-500 hover:text-orange-400 font-medium text-lg"
                    >
                      0535 250 93 33
                    </a>
                  </div>
                </div>

                {/* E-posta */}
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500/20 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">E-posta</h3>
                    <p className="text-gray-300">Genel sorularınız için</p>
                    <a
                      href="mailto:info@chef2.0.com"
                      className="text-orange-500 hover:text-orange-400 font-medium"
                    >
                      info@chef2.0.com
                    </a>
                  </div>
                </div>

                {/* Çalışma Saatleri */}
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500/20 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Çalışma Saatleri</h3>
                    <p className="text-gray-300">Test desteği</p>
                    <p className="text-gray-300">Pazartesi - Cuma: 09:00 - 18:00</p>
                    <p className="text-gray-300">Hafta sonu: 10:00 - 16:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* İletişim Formu */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                Mesaj Gönderin
              </h2>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                      Ad
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="Adınız"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                      Soyad
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Konu
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Konu seçin</option>
                    <option value="technical">Teknik Destek</option>
                    <option value="course">Kurs Hakkında</option>
                    <option value="payment">Ödeme Sorunu</option>
                    <option value="general">Genel Soru</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Mesaj
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                    placeholder="Mesajınızı buraya yazın..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Mesaj Gönder
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* SSS Bölümü */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Sık Sorulan Sorular
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3">
                Test sırasında sorun yaşıyorum, ne yapmalıyım?
              </h3>
              <p className="text-gray-400">
                İsmail Kayaalp ile iletişime geçin: <strong className="text-orange-400">0535 250 93 33</strong>
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3">
                Video izlerken sorun yaşıyorum
              </h3>
              <p className="text-gray-400">
                Video player ile ilgili teknik sorunlar için yukarıdaki telefon numarasını arayın.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3">
                Kurs satın alma sorunu
              </h3>
              <p className="text-gray-400">
                Ödeme işlemleri ile ilgili sorunlarınız için İsmail Kayaalp ile iletişime geçin.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3">
                Hesap sorunları
              </h3>
              <p className="text-gray-400">
                Giriş yapamama, şifre unutma gibi hesap sorunları için destek hattımızı arayın.
              </p>
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
                <span className="text-2xl font-bold">Chef2.0</span>
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
                <li><Link href="/about" className="hover:text-white">Hakkımızda</Link></li>
                <li><Link href="#" className="hover:text-white">Eğitmenler</Link></li>
                <li><Link href="#" className="hover:text-white">Kariyer</Link></li>
                <li><Link href="/contact" className="hover:text-white">İletişim</Link></li>
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
            <p>&copy; 2024 Chef2.0. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
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
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef'e Sor</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
