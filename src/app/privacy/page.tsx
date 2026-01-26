import Link from "next/link";
import { ChefHat, Shield, Lock, Eye, FileText } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";

export default async function PrivacyPage() {
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
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Gizlilik Politikası</h1>
                    <p className="text-gray-400">Son Güncelleme: 26 Ocak 2026</p>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-invert max-w-none space-y-12">
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 italic">
                                <Shield className="text-orange-500" /> 1. Veri Sorumlusu
                            </h2>
                            <p className="text-gray-400">
                                Culinora ("Şirket"), kullanıcılarımızın kişisel verilerinin güvenliğine ve gizliliğine büyük önem vermektedir.
                                Bu politika, verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Eye className="text-orange-500" /> 2. Toplanan Veriler
                            </h2>
                            <p className="text-gray-400">
                                Platformumuzu kullanırken aşağıdaki verileri toplayabiliriz:
                            </p>
                            <ul className="list-disc pl-6 mt-4 text-gray-400 space-y-2">
                                <li>Hesap Bilgileri: Ad, soyad, e-posta adresi, profil fotoğrafı.</li>
                                <li>Ödeme Bilgileri: İşlem geçmişi (kart bilgileri Iyzico tarafından saklanır).</li>
                                <li>Kullanım Verileri: Tamamlanan dersler, sınav sonuçları, tercihler.</li>
                                <li>Teknik Veriler: IP adresi, tarayıcı türü, çerez bilgileri.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Lock className="text-orange-500" /> 3. Veri Güvenliği
                            </h2>
                            <p className="text-gray-400">
                                Verileriniz, endüstri standardı olan SSL şifreleme ve güvenli sunucularda saklanmaktadır.
                                Kişisel verileriniz hiçbir üçüncü taraf ile ticari amaçla paylaşılmaz.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <FileText className="text-orange-500" /> 4. Haklarınız
                            </h2>
                            <p className="text-gray-400">
                                KVKK ve GDPR kapsamında; verilerinize erişme, düzeltme, silme veya işlenmesine itiraz etme haklarına sahipsiniz.
                                Bu haklarınızı kullanmak için privacy@culinora.net adresi üzerinden bizimle iletişime geçebilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
