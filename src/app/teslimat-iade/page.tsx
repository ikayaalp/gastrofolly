import Link from "next/link"
import Image from "next/image";
import { ChefHat, Truck, RefreshCw, Clock, ShieldCheck, Info } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";

export const metadata = {
    title: "Teslimat ve İade - Culinora",
    description: "Culinora platformu teslimat ve iade koşulları. Dijital içerik teslimatı ve iade politikası hakkında bilgi edinin.",
};

export default async function DeliveryReturnPage() {
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
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Teslimat ve İade</h1>
                    <p className="text-gray-400">Son Güncelleme: 18 Şubat 2026</p>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-invert max-w-none space-y-12">

                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Truck className="text-orange-500" /> 1. Teslimat Bilgileri
                            </h2>
                            <div className="text-gray-400 space-y-4">
                                <p>
                                    Culinora, tamamen dijital bir eğitim platformudur. Hizmetlerimiz fiziksel ürün içermemektedir.
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Tüm kurs içerikleri (videolar, dokümanlar, tarifler) dijital ortamda sunulmaktadır.</li>
                                    <li>Fiziksel ürün gönderimi veya kargo teslimatı bulunmamaktadır.</li>
                                    <li>Tüm içerikler internet üzerinden erişilebilir durumdadır.</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Clock className="text-orange-500" /> 2. Dijital İçerik Erişimi
                            </h2>
                            <div className="text-gray-400 space-y-4">
                                <p>
                                    Ödemenizin onaylanmasının ardından dijital içeriklere erişiminiz aşağıdaki şekilde sağlanır:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>
                                        <strong className="text-white">Anında erişim:</strong> Ödeme onaylandıktan hemen sonra tüm abonelik kapsamındaki kurslara erişim sağlanır.
                                    </li>
                                    <li>
                                        <strong className="text-white">7/24 erişim:</strong> İçeriklere internet bağlantınız olduğu sürece dilediğiniz zaman ulaşabilirsiniz.
                                    </li>
                                    <li>
                                        <strong className="text-white">Çoklu cihaz desteği:</strong> Web tarayıcı ve mobil uygulama üzerinden içeriklere erişebilirsiniz.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <RefreshCw className="text-orange-500" /> 3. İade Koşulları
                            </h2>
                            <div className="text-gray-400 space-y-4">
                                <p>
                                    Dijital içerik hizmetleri için iade koşulları aşağıdaki gibidir:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>
                                        Satın alma tarihinden itibaren <strong className="text-white">14 gün</strong> içinde iade talebinde bulunabilirsiniz.
                                    </li>
                                    <li>
                                        İade talebi için dijital içeriğe henüz erişim sağlanmamış olması gerekmektedir.
                                    </li>
                                    <li>
                                        Dijital içeriğe erişim sağlandıktan sonra (kurs izleme, materyal görüntüleme vb.)
                                        cayma hakkı ortadan kalkar.
                                    </li>
                                    <li>
                                        Teknik problemler nedeniyle hizmetten faydalanamadıysanız destek ekibimize başvurabilirsiniz.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <ShieldCheck className="text-orange-500" /> 4. İade Süreci
                            </h2>
                            <div className="text-gray-400 space-y-4">
                                <p>İade talebiniz aşağıdaki adımlarla gerçekleştirilir:</p>
                                <ol className="list-decimal list-inside space-y-2 ml-4">
                                    <li>
                                        <strong className="text-white">destek@culinora.com</strong> adresine veya{" "}
                                        <Link href="/contact" className="text-orange-500 hover:text-orange-400 transition-colors">İletişim</Link> sayfasından başvurun.
                                    </li>
                                    <li>Üyelik bilgilerinizi ve iade gerekçenizi belirtin.</li>
                                    <li>Talebiniz en geç <strong className="text-white">48 saat</strong> içinde incelenir.</li>
                                    <li>Onaylanan iadeler, ödemenin yapıldığı yöntemle <strong className="text-white">10 iş günü</strong> içinde iade edilir.</li>
                                </ol>
                            </div>
                        </div>

                        <div className="bg-orange-600/10 border border-orange-500/20 p-6 rounded-xl">
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <Info className="text-orange-500" /> Önemli Not
                            </h2>
                            <p className="text-sm text-gray-300">
                                Culinora platformunda fiziksel ürün satışı yapılmamaktadır. Tüm hizmetler dijital ortamda sunulmakta olup,
                                teslimat anında dijital erişim şeklinde gerçekleşmektedir. Bu sayfa, 6502 sayılı Tüketicinin Korunması
                                Hakkında Kanun ve ilgili mevzuat kapsamında bilgilendirme amacıyla hazırlanmıştır.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
