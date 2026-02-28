import Link from "next/link"
import Image from "next/image";
import { ChefHat, Scale, FileCheck, AlertCircle, Info } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";

export default async function TermsPage() {
    const session = await getServerSession(authOptions);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link href={session?.user ? "/home" : "/"} className="flex items-center gap-0.5">
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
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Kullanım Şartları</h1>
                    <p className="text-gray-400">Son Güncelleme: 26 Ocak 2026</p>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-invert max-w-none space-y-12">
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Scale className="text-orange-500" /> 1. Genel Koşullar
                            </h2>
                            <p className="text-gray-400">
                                Culinora platformuna üye olarak ve hizmetlerimizi kullanarak, işbu kullanım şartlarını kabul etmiş sayılırsınız.
                                Platform 18 yaşından büyükler veya veli izni olanlar içindir.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <FileCheck className="text-orange-500" /> 2. Fikri Mülkiyet
                            </h2>
                            <p className="text-gray-400">
                                Platformdaki tüm videolar, görseller, tarifler ve metinler Culinora'nın mülkiyetindedir.
                                İçeriklerin kopyalanması, dağıtılması veya izinsiz paylaşılması yasal işlemlere tabidir.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <AlertCircle className="text-orange-500" /> 3. Kullanıcı Sorumluluğu
                            </h2>
                            <p className="text-gray-400">
                                Hesap güvenliğinizden siz sorumlusunuz. Mutfak uygulamaları sırasında oluşabilecek kişisel yaralanmalardan
                                veya ekipman hasarlarından platform sorumlu tutulamaz. Uygulamaları güvenlik kurallarına uygun yapınız.
                            </p>
                        </div>

                        <div className="bg-orange-600/10 border border-orange-500/20 p-6 rounded-xl">
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <Info className="text-orange-500" /> Önemli Not
                            </h2>
                            <p className="text-sm text-gray-300">
                                Culinora, bu şartları önceden bildirim yapmaksızın güncelleme hakkını saklı tutar.
                                Platformun kullanımı mevcut şartların kabulü anlamına gelir.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
