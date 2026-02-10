import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Sıkça Sorulan Sorular",
    description: "Culinora hakkında merak ettiğiniz her şey. Kurslar, üyelik, ödeme ve sertifikalar hakkında sıkça sorulan sorular.",
};
import { ChefHat, HelpCircle, ChevronDown, MessageSquare, BookOpen, ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";

export default async function FAQPage() {
    const session = await getServerSession(authOptions);

    const faqs = [
        {
            question: "Culinora nedir?",
            answer: "Culinora, gastronomi dünyasının en iyilerinden online eğitimler alabileceğiniz, sertifika programları sunan bir edtech platformudur. Mutfak sanatlarını dijital çağın imkanlarıyla birleştirerek herkese eriştiriyoruz."
        },
        {
            question: "Kursları ne kadar süreyle izleyebilirim?",
            answer: "Bir kursu satın aldığınızda veya Premium üyeliğiniz devam ettiği sürece, derslere 7/24 sınırsız erişim hakkına sahip olursunuz. Kendi hızınızda öğrenebilirsiniz."
        },
        {
            question: "Sertifika veriliyor mu?",
            answer: "Evet, her kursun sonunda ilgili sınavı veya projeyi başarıyla tamamladığınızda, CV'nize ekleyebileceğiniz ve LinkedIn'de paylaşabileceğiniz dijital Culinora sertifikası alırsınız."
        },
        {
            question: "Premium üyelik neleri kapsar?",
            answer: "Premium üyelik, platformdaki tüm mevcut ve yeni eklenecek kurslara sınırsız erişim, özel şef workshopları, indirilebilir kaynaklar ve topluluk özelliklerini kapsar."
        },
        {
            question: "Ödeme yöntemleri nelerdir?",
            answer: "Tüm kredi ve banka kartları ile güvenli bir şekilde ödeme yapabilirsiniz. Iyzico altyapısını kullanarak işlemlerinizi güvenle gerçekleştiriyoruz."
        },
        {
            question: "İptal ve iade koşullarınız nelerdir?",
            answer: "Memnun kalmadığınız durumlarda, satın alma tarihinden itibaren 14 gün içinde, içeriğin %20'sinden fazlasını izlememiş olmanız kaydıyla iade talebinde bulunabilirsiniz."
        }
    ];

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
            <section className="pt-32 pb-20 bg-gradient-to-b from-gray-900 to-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Sıkça Sorulan Sorular</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Culinora hakkında merak ettiğiniz her şeyi burada bulabilirsiniz.
                    </p>
                </div>
            </section>

            {/* FAQ Accordion */}
            <section className="py-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-colors">
                                <div className="p-6">
                                    <h3 className="text-lg font-bold flex items-center gap-3">
                                        <HelpCircle className="w-5 h-5 text-orange-500" />
                                        {faq.question}
                                    </h3>
                                    <p className="mt-4 text-gray-400 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Support CTA */}
            <section className="py-20 bg-gray-900/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-8">Hala sorunuz mu var?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="p-8 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <MessageSquare className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                            <h3 className="font-bold mb-2">Canlı Destek</h3>
                            <p className="text-sm text-gray-400">Hafta içi 09:00 - 18:00 arası canlı sohbet.</p>
                        </div>
                        <div className="p-8 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <BookOpen className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                            <h3 className="font-bold mb-2">Rehberler</h3>
                            <p className="text-sm text-gray-400">Detaylı kullanım ve platform rehberleri.</p>
                        </div>
                        <div className="p-8 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <ShieldCheck className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                            <h3 className="font-bold mb-2">Güvenlik</h3>
                            <p className="text-sm text-gray-400">Gizlilik ve veri güvenliği politikalarımız.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
