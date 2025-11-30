import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { ChefHat, Check, Crown, Sparkles, BookOpen, Award, Users, MessageCircle, Home } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

export default async function SubscriptionPage() {
    const session = await getServerSession(authOptions)

    return (
        <div className="min-h-screen bg-black">
            {/* Desktop Header */}
            <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-8">
                            <Link href="/home" className="flex items-center space-x-2">
                                <ChefHat className="h-8 w-8 text-orange-500" />
                                <span className="text-2xl font-bold text-white">Chef2.0</span>
                            </Link>
                            {session?.user && (
                                <nav className="hidden md:flex space-x-6">
                                    <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                                        Ana Sayfa
                                    </Link>
                                    <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                                        Kurslarım
                                    </Link>
                                    <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                                        Chef Sosyal
                                    </Link>
                                </nav>
                            )}
                        </div>

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
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
                <div className="flex justify-between items-center py-3 px-4">
                    <Link href="/home" className="flex items-center space-x-2">
                        <ChefHat className="h-6 w-6 text-orange-500" />
                        <span className="text-lg font-bold text-white">Chef2.0</span>
                    </Link>
                    <div className="flex items-center space-x-3">
                        {session?.user ? (
                            <UserDropdown />
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="text-gray-300 hover:text-orange-500 text-sm"
                            >
                                Giriş Yap
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-20 md:pt-24 pb-20 md:pb-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-full px-6 py-2 mb-6">
                            <Sparkles className="h-5 w-5 text-orange-400" />
                            <span className="text-orange-400 font-semibold">Premium Üyelik</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Seni Bekleyen Eşsiz Deneyime<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                Hemen Başla!
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Neo Skoladaki tüm eğitimlere sınırsız erişim, premium içerikler ve daha fazlası!
                        </p>
                    </div>

                    {/* Pricing Card */}
                    <div className="max-w-2xl mx-auto mb-16">
                        <div className="bg-gradient-to-br from-red-900/40 via-red-800/40 to-black/40 border-2 border-red-500/50 rounded-2xl p-8 relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500"></div>
                            </div>

                            <div className="relative z-10">
                                {/* Badge */}
                                <div className="flex justify-center mb-6">
                                    <div className="bg-red-600 rounded-full p-4">
                                        <Crown className="h-12 w-12 text-white" />
                                    </div>
                                </div>

                                {/* Plan Name */}
                                <h2 className="text-3xl font-bold text-white text-center mb-2">PREMIUM</h2>
                                <p className="text-gray-300 text-center text-lg mb-8">Neo Skoladaki Tüm Eğitimler!</p>

                                {/* Price */}
                                <div className="text-center mb-8">
                                    <div className="text-6xl font-bold text-white mb-2">
                                        199 ₺
                                    </div>
                                    <p className="text-gray-300 text-xl">/ Taksitli Ödeme</p>
                                </div>

                                {/* CTA Buttons */}
                                <div className="flex flex-col gap-4 mb-8">
                                    <button className="w-full bg-red-600 hover:bg-red-700 text-white text-lg font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105">
                                        Üyeliğini Başlat
                                    </button>
                                    <button className="w-full bg-black/50 hover:bg-black/70 border-2 border-red-500/50 text-white text-lg font-semibold py-4 rounded-xl transition-all duration-300">
                                        Hediye Et
                                    </button>
                                </div>

                                {/* Features */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1">
                                            <Check className="h-5 w-5 text-green-400" />
                                        </div>
                                        <span className="text-white">Tüm kurslara sınırsız erişim</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1">
                                            <Check className="h-5 w-5 text-green-400" />
                                        </div>
                                        <span className="text-white">Yeni eklenen tüm içeriklere anında erişim</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1">
                                            <Check className="h-5 w-5 text-green-400" />
                                        </div>
                                        <span className="text-white">Tamamlama sertifikaları</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1">
                                            <Check className="h-5 w-5 text-green-400" />
                                        </div>
                                        <span className="text-white">Premium topluluk erişimi</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1">
                                            <Check className="h-5 w-5 text-green-400" />
                                        </div>
                                        <span className="text-white">Eğitmenlerle doğrudan iletişim</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1">
                                            <Check className="h-5 w-5 text-green-400" />
                                        </div>
                                        <span className="text-white">Mobil ve masaüstü erişim</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="bg-black border border-gray-800 rounded-xl p-6 text-center">
                            <div className="bg-orange-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sınırsız Öğrenme</h3>
                            <p className="text-gray-400">Tüm kurslara istediğiniz zaman erişin</p>
                        </div>

                        <div className="bg-black border border-gray-800 rounded-xl p-6 text-center">
                            <div className="bg-orange-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Award className="h-8 w-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sertifikalar</h3>
                            <p className="text-gray-400">Her kurs için profesyonel sertifika</p>
                        </div>

                        <div className="bg-black border border-gray-800 rounded-xl p-6 text-center">
                            <div className="bg-orange-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Users className="h-8 w-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Topluluk</h3>
                            <p className="text-gray-400">Premium üyelerle networking</p>
                        </div>
                    </div>

                    {/* FAQ or Additional Info */}
                    <div className="bg-black border border-gray-800 rounded-xl p-8 text-center">
                        <h3 className="text-2xl font-bold text-white mb-4">Sorularınız mı var?</h3>
                        <p className="text-gray-300 mb-6">
                            Premium üyelik hakkında daha fazla bilgi almak için bizimle iletişime geçin.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                        >
                            İletişime Geç
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-black">
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
                    <Link href="/messages" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Mesajlar</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
