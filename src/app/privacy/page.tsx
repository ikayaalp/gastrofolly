import Link from "next/link"
import Image from "next/image";
import { Shield, Eye, Target, Scale, Share2, Lock, Clock, UserCheck } from "lucide-react";
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
                        {/* 1. Veri Sorumlusu */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 italic">
                                <Shield className="text-orange-500" /> 1. Veri Sorumlusu
                            </h2>
                            <p className="text-gray-400">
                                Culinora, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusudur. Sorularınız için info@culinora.net adresinden bize ulaşabilirsiniz.
                            </p>
                        </div>

                        {/* 2. Toplanan Veriler */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Eye className="text-orange-500" /> 2. Toplanan Veriler ve Toplama Yöntemi
                            </h2>
                            <p className="text-gray-400">
                                Hesap bilgileri (ad, soyad, e-posta, telefon, profil fotoğrafı) kayıt/giriş formları ve Google ile giriş yoluyla; ödeme bilgileri (işlem geçmişi, abonelik durumu — kart bilgileriniz bizde değil Iyzico/Stripe/RevenueCat'te saklanır); kullanım verileri (tamamlanan dersler, ilerleme durumu, forum gönderileri) ve teknik veriler (cihaz modeli, işletim sistemi, IP adresi) uygulamayı kullandığınızda otomatik olarak toplanır.
                            </p>
                        </div>

                        {/* 3. İşlenme Amaçları */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Target className="text-orange-500" /> 3. İşlenme Amaçları
                            </h2>
                            <p className="text-gray-400">
                                Hesabınızı oluşturmak ve yönetmek, satın aldığınız kursları sunmak, ödeme işlemlerini gerçekleştirmek, bildirim ve e-posta göndermek, uygulamayı geliştirmek, güvenliğini sağlamak ve yasal yükümlülükleri yerine getirmek amacıyla işlenir.
                            </p>
                        </div>

                        {/* 4. Hukuki Sebep */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Scale className="text-orange-500" /> 4. Hukuki Sebep
                            </h2>
                            <p className="text-gray-400">
                                Verileriniz KVKK madde 5 kapsamında; sözleşmenin kurulması veya ifası için gerekli olması, hukuki yükümlülüğümüzün yerine getirilmesi, meşru menfaatimiz ve gerekli hallerde açık rızanız hukuki sebeplerine dayanılarak işlenir.
                            </p>
                        </div>

                        {/* 5. Aktarılan Taraflar */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Share2 className="text-orange-500" /> 5. Verilerin Aktarıldığı Taraflar
                            </h2>
                            <p className="text-gray-400">
                                Ödeme işlemleri için Iyzico ve Stripe, medya depolama için Cloudinary, mobil abonelik yönetimi için RevenueCat, e-posta bildirimleri için Resend ile sınırlı ve gerekli ölçüde veri paylaşılır. Verileriniz hiçbir şekilde ticari amaçla satılmaz veya kiralanmaz.
                            </p>
                        </div>

                        {/* 6. Veri Güvenliği */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Lock className="text-orange-500" /> 6. Veri Güvenliği
                            </h2>
                            <p className="text-gray-400">
                                Şifreniz asla düz metin olarak saklanmaz, geri döndürülemez şekilde şifrelenir (hash'lenir). Tüm veri iletimi SSL/TLS ile korunur ve sunucularımıza yetkisiz erişim engellenir.
                            </p>
                        </div>

                        {/* 7. Saklama ve Silme */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Clock className="text-orange-500" /> 7. Saklama Süresi ve Silme
                            </h2>
                            <p className="text-gray-400">
                                Verileriniz hesabınız aktif olduğu sürece ve yasal saklama süreleri boyunca tutulur. Ayarlar &gt; Hesap Bilgileri bölümünden hesabınızı sildiğinizde kişisel verileriniz sistemlerimizden kalıcı olarak silinir.
                            </p>
                        </div>

                        {/* 8. Haklarınız */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <UserCheck className="text-orange-500" /> 8. Haklarınız
                            </h2>
                            <p className="text-gray-400">
                                KVKK madde 11 kapsamında; verilerinizin işlenip işlenmediğini öğrenme, işlenme amacını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini isteme ve işlenmesine itiraz etme haklarına sahipsiniz. Bu hakları kullanmak için info@culinora.net adresine yazabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
