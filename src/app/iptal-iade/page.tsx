import Link from "next/link";
import { ChefHat, AlertCircle, RefreshCw, XCircle, Mail, Info } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";

export const metadata = {
    title: "İptal ve İade Şartları - Culinora",
    description: "Culinora platformu iptal ve iade politikası. Abonelik iptal koşulları ve iade prosedürleri hakkında bilgi edinin.",
};

export default async function CancellationRefundPage() {
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
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">İptal ve İade Şartları</h1>
                    <p className="text-gray-400">Son Güncelleme: 18 Şubat 2026</p>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-invert max-w-none space-y-12">

                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <AlertCircle className="text-orange-500" /> 1. Genel Bilgi
                            </h2>
                            <p className="text-gray-400">
                                Culinora, dijital içerik ve eğitim hizmeti sunan bir çevrimiçi platformdur.
                                Platformumuzda sunulan tüm hizmetler dijital ortamda tüketilmekte olup, fiziksel bir ürün teslimatı yapılmamaktadır.
                                İşbu iptal ve iade şartları, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
                                kapsamında hazırlanmıştır.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <XCircle className="text-orange-500" /> 2. Abonelik İptal Koşulları
                            </h2>
                            <div className="text-gray-400 space-y-4">
                                <p>
                                    Kullanıcılar, aktif aboneliklerini istedikleri zaman iptal edebilirler. Abonelik iptali yapıldığında:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Mevcut ödeme döneminizin sonuna kadar tüm içeriklere erişiminiz devam eder.</li>
                                    <li>Ödeme dönemi sona erdikten sonra abonelik otomatik olarak yenilenmez.</li>
                                    <li>İptal işlemi, hesap ayarları sayfasından veya destek ekibimize başvurarak gerçekleştirilebilir.</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <RefreshCw className="text-orange-500" /> 3. İade Politikası
                            </h2>
                            <div className="text-gray-400 space-y-4">
                                <p>
                                    Dijital içerik hizmetimizin doğası gereği, aşağıdaki koşullar çerçevesinde iade işlemi uygulanmaktadır:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>
                                        <strong className="text-white">Satın alma tarihinden itibaren 14 gün içinde</strong> iade talebinde bulunabilirsiniz,
                                        ancak bu süre içinde dijital içeriğe erişim sağlanmamış olması gerekmektedir.
                                    </li>
                                    <li>
                                        Dijital içeriğe erişim sağlandıktan sonra (kurs videosu izleme, materyal indirme vb.),
                                        <strong className="text-white"> cayma hakkı ortadan kalkar.</strong>
                                    </li>
                                    <li>
                                        Teknik bir sorun nedeniyle hizmetten yararlanamadığınız durumlarda,
                                        destek ekibimizle iletişime geçerek iade talebinde bulunabilirsiniz.
                                    </li>
                                    <li>
                                        İade talepleri incelenerek en geç <strong className="text-white">10 iş günü</strong> içerisinde
                                        sonuçlandırılır.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Info className="text-orange-500" /> 4. İade Prosedürü
                            </h2>
                            <div className="text-gray-400 space-y-4">
                                <p>İade talebinde bulunmak için:</p>
                                <ol className="list-decimal list-inside space-y-2 ml-4">
                                    <li>Destek ekibimize e-posta yoluyla başvurun.</li>
                                    <li>Başvurunuzda üyelik bilgilerinizi ve iade gerekçenizi belirtin.</li>
                                    <li>Talebiniz en geç 48 saat içerisinde değerlendirilecektir.</li>
                                    <li>Onaylanan iadeler, ödemenin yapıldığı yöntemle iade edilir.</li>
                                </ol>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Mail className="text-orange-500" /> 5. İletişim
                            </h2>
                            <p className="text-gray-400">
                                İptal ve iade talepleriniz için aşağıdaki kanallardan bize ulaşabilirsiniz:
                            </p>
                            <div className="mt-4 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                                <p className="text-gray-300">
                                    <strong className="text-white">E-posta:</strong> destek@culinora.com
                                </p>
                                <p className="text-gray-300 mt-2">
                                    <strong className="text-white">İletişim Sayfası:</strong>{" "}
                                    <Link href="/contact" className="text-orange-500 hover:text-orange-400 transition-colors">
                                        culinora.com/contact
                                    </Link>
                                </p>
                            </div>
                        </div>

                        <div className="bg-orange-600/10 border border-orange-500/20 p-6 rounded-xl">
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <Info className="text-orange-500" /> Önemli Not
                            </h2>
                            <p className="text-sm text-gray-300">
                                Culinora, bu iptal ve iade şartlarını önceden bildirim yapmaksızın güncelleme hakkını saklı tutar.
                                Güncel şartlar her zaman bu sayfada yayınlanacaktır.
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
