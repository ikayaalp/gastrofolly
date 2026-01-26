import Link from "next/link";
import { ChefHat, Search, MessageSquare, Book, Video, Mail, Phone, MapPin } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";

export default async function HelpPage() {
    const session = await getServerSession(authOptions);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link href={session?.user ? "/home" : "/"} className="flex items-center space-x-2">
                            <ChefHat className="h-8 w-8 text-orange-500" />
                            <span className="text-2xl font-bold text-white">Culinora</span>
                        </Link>
                        <nav className="hidden md:flex space-x-8">
                            <Link href={session?.user ? "/home" : "/"} className="text-gray-300 hover:text-orange-500 transition-colors">Ana Sayfa</Link>
                            <Link href="/courses" className="text-gray-300 hover:text-orange-500 transition-colors">Kurslar</Link>
                            <Link href="/about" className="text-gray-300 hover:text-orange-500 transition-colors">Hakkımızda</Link>
                        </nav>
                        <div className="flex items-center space-x-4">
                            {session?.user ? (
                                <UserDropdown />
                            ) : (
                                <Link href="/auth/signup" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">Kayıt Ol</Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-b from-gray-900 to-black">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-8">Yardım Merkezi</h1>
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Nasıl yardımcı olabiliriz?"
                            className="w-full bg-gray-900/50 border border-gray-800 py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-lg"
                        />
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="p-8 bg-gray-900/30 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all group">
                            <div className="bg-orange-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Video className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Kurs Erişimi</h3>
                            <p className="text-gray-400 text-sm">Videoları izleme, kaynakları indirme ve sertifika alma süreçleri.</p>
                        </div>
                        <div className="p-8 bg-gray-900/30 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all group">
                            <div className="bg-orange-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Book className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Üyelik ve Ödeme</h3>
                            <p className="text-gray-400 text-sm">Premium üyelik yönetimi, fatura bilgileri ve iade işlemleri.</p>
                        </div>
                        <div className="p-8 bg-gray-900/30 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all group">
                            <div className="bg-orange-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Topluluk</h3>
                            <p className="text-gray-400 text-sm">Chef Sosyal kullanımı ve diğer öğrencilerle etkileşim.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16 bg-gray-900/30 border-y border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold">Bize Ulaşın</h2>
                        <p className="text-gray-400 mt-2">Aradığınızı bulamadınız mı? Doğrudan bizimle konuşun.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center">
                            <Mail className="w-8 h-8 text-orange-500 mb-4" />
                            <h4 className="font-bold mb-2">E-posta</h4>
                            <p className="text-gray-400">destek@culinora.net</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <Phone className="w-8 h-8 text-orange-500 mb-4" />
                            <h4 className="font-bold mb-2">Telefon</h4>
                            <p className="text-gray-400">+90 (212) 555 01 00</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <MapPin className="w-8 h-8 text-orange-500 mb-4" />
                            <h4 className="font-bold mb-2">Ofis</h4>
                            <p className="text-gray-400">İstanbul, Türkiye</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
