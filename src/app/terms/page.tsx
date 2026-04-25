import Link from "next/link"
import Image from "next/image";
import { Scale, FileCheck, AlertCircle, Info, CreditCard, RefreshCw, ShieldCheck, Users, Globe, Gavel, BookOpen, Ban, Mail } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";

export const metadata = {
    title: "Kullanım Koşulları (EULA) | Culinora",
    description: "Culinora platformunun kullanım koşulları, abonelik şartları, iade politikası ve son kullanıcı lisans sözleşmesi (EULA).",
};

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
                                <Image src="/logo.png" alt="C" fill className="object-contain" />
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
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Kullanım Koşulları ve Son Kullanıcı Lisans Sözleşmesi (EULA)</h1>
                    <p className="text-gray-400 text-lg">Son Güncelleme: 25 Nisan 2026</p>
                    <p className="text-gray-500 mt-2 text-sm">Bu sözleşme, Culinora uygulamasını ve web platformunu kullanımınızı düzenleyen yasal bir anlaşmadır.</p>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-invert max-w-none space-y-10">

                        {/* 1. Genel Koşullar */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Scale className="text-orange-500 flex-shrink-0" /> 1. Genel Koşullar ve Kabul
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Culinora uygulamasını (&quot;Uygulama&quot;) veya web platformunu (&quot;Platform&quot;) indirerek, yükleyerek veya kullanarak, 
                                bu Kullanım Koşulları ve Son Kullanıcı Lisans Sözleşmesini (&quot;EULA&quot;) okuduğunuzu, anladığınızı ve kabul ettiğinizi 
                                beyan etmiş olursunuz. Bu koşulları kabul etmiyorsanız, lütfen Uygulamayı kullanmayınız.
                            </p>
                            <p className="text-gray-400 leading-relaxed mt-3">
                                Culinora, profesyonel gastronomi eğitimi sunan bir dijital öğrenme platformudur. Hizmetlerimiz; 
                                video dersler, tarifler, sertifika programları ve topluluk özelliklerini kapsamaktadır.
                            </p>
                            <p className="text-gray-400 leading-relaxed mt-3">
                                Platform, 18 yaşından büyük bireyler veya yasal vasi iznine sahip kişiler tarafından kullanılabilir.
                            </p>
                        </div>

                        {/* 2. Lisans */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <BookOpen className="text-orange-500 flex-shrink-0" /> 2. Lisans Hakkı
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Culinora, size Uygulamayı kişisel, ticari olmayan amaçlarla kullanmanız için sınırlı, münhasır olmayan, 
                                devredilemez ve geri alınabilir bir lisans vermektedir. Bu lisans:
                            </p>
                            <ul className="list-disc pl-6 mt-4 text-gray-400 space-y-2">
                                <li>Yalnızca sizin sahip olduğunuz veya kontrol ettiğiniz cihazlarda kullanım hakkı verir.</li>
                                <li>Apple App Store Kullanım Koşullarında belirtilen Kullanım Kurallarına tabidir.</li>
                                <li>Uygulamayı kopyalama, değiştirme, dağıtma, satma veya tersine mühendislik yapma hakkı vermez.</li>
                                <li>Culinora tarafından herhangi bir zamanda, herhangi bir nedenle iptal edilebilir.</li>
                            </ul>
                        </div>

                        {/* 3. Abonelik Koşulları */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-orange-500/30">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <CreditCard className="text-orange-500 flex-shrink-0" /> 3. Abonelik Koşulları ve Ödeme
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Culinora, premium içeriklere erişim için otomatik yenilenen abonelik planları sunmaktadır:
                            </p>

                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white">3.1 Abonelik Planları</h3>
                                <ul className="list-disc pl-6 text-gray-400 space-y-2">
                                    <li><strong className="text-white">Culinora Premium Aylık:</strong> Aylık olarak faturalandırılır ve her ay otomatik yenilenir.</li>
                                    <li><strong className="text-white">Culinora Premium Yıllık:</strong> Yıllık olarak faturalandırılır ve her yıl otomatik yenilenir.</li>
                                </ul>
                            </div>

                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white">3.2 Ödeme</h3>
                                <ul className="list-disc pl-6 text-gray-400 space-y-2">
                                    <li>Ödeme, satın alma onaylandığında Apple ID hesabınızdan tahsil edilir.</li>
                                    <li>Abonelik, mevcut dönemin bitiminden en az 24 saat önce iptal edilmediği sürece otomatik olarak yenilenir.</li>
                                    <li>Yenileme ücreti, mevcut dönemin bitiminden önceki 24 saat içinde hesabınızdan tahsil edilir.</li>
                                    <li>Abonelik fiyatları, abonelik planı seçim ekranında açıkça gösterilmektedir.</li>
                                </ul>
                            </div>

                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white">3.3 Ücretsiz Deneme Süresi</h3>
                                <p className="text-gray-400">
                                    Sunulması halinde, ücretsiz deneme süresinin kullanılmayan kısmı, kullanıcının ücretli aboneliğe geçiş 
                                    yapması durumunda geçerliliğini yitirir.
                                </p>
                            </div>
                        </div>

                        {/* 4. İptal ve İade */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <RefreshCw className="text-orange-500 flex-shrink-0" /> 4. İptal ve İade Politikası
                            </h2>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">4.1 Abonelik İptali</h3>
                                <ul className="list-disc pl-6 text-gray-400 space-y-2">
                                    <li>Aboneliğinizi istediğiniz zaman iptal edebilirsiniz.</li>
                                    <li>İptal işlemi, cihazınızdaki <strong className="text-white">Ayarlar → Apple ID → Abonelikler</strong> bölümünden yapılabilir.</li>
                                    <li>İptal edilen abonelik, mevcut ödeme döneminin sonuna kadar geçerliliğini korur.</li>
                                    <li>Uygulamanın silinmesi, aboneliğinizi otomatik olarak iptal etmez.</li>
                                </ul>
                            </div>
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white">4.2 İade</h3>
                                <p className="text-gray-400">
                                    Apple App Store üzerinden yapılan satın alımlar için iade talepleri, Apple&apos;ın iade politikasına tabidir. 
                                    İade talebinde bulunmak için <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline hover:text-orange-400">reportaproblem.apple.com</a> adresini 
                                    ziyaret edebilir veya Apple Destek ile iletişime geçebilirsiniz.
                                </p>
                            </div>
                        </div>

                        {/* 5. Fikri Mülkiyet */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <FileCheck className="text-orange-500 flex-shrink-0" /> 5. Fikri Mülkiyet Hakları
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Uygulama ve Platform üzerindeki tüm içerikler; video dersler, görseller, tarifler, metinler, yazılım kodu, 
                                tasarımlar, logolar ve ticari markalar dahil olmak üzere Culinora&apos;nın veya lisans verenlerinin mülkiyetindedir 
                                ve telif hakkı, ticari marka ve diğer fikri mülkiyet yasaları tarafından korunmaktadır.
                            </p>
                            <p className="text-gray-400 leading-relaxed mt-3">
                                İçeriklerin izinsiz kopyalanması, dağıtılması, yeniden yayımlanması, değiştirilmesi veya ticari amaçlarla 
                                kullanılması kesinlikle yasaktır ve yasal işleme tabidir.
                            </p>
                        </div>

                        {/* 6. Kullanıcı Sorumluluğu */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Users className="text-orange-500 flex-shrink-0" /> 6. Kullanıcı Yükümlülükleri
                            </h2>
                            <p className="text-gray-400 leading-relaxed">Uygulama kullanıcıları olarak aşağıdaki yükümlülükleri kabul edersiniz:</p>
                            <ul className="list-disc pl-6 mt-4 text-gray-400 space-y-2">
                                <li>Hesap bilgilerinizin güvenliğinden ve gizliliğinden siz sorumlusunuz.</li>
                                <li>Hesabınızı üçüncü kişilerle paylaşmayacağınızı kabul edersiniz.</li>
                                <li>Platform üzerinde yasalara aykırı, hakaret içeren veya uygunsuz içerik paylaşmayacağınızı taahhüt edersiniz.</li>
                                <li>Diğer kullanıcıların deneyimini olumsuz etkileyecek davranışlardan kaçınacağınızı kabul edersiniz.</li>
                                <li>Mutfak uygulamaları sırasında kişisel güvenlik kurallarına uyacağınızı kabul edersiniz. Oluşabilecek kişisel yaralanmalardan veya ekipman hasarlarından Platform sorumlu tutulamaz.</li>
                            </ul>
                        </div>

                        {/* 7. Yasaklanan Kullanımlar */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Ban className="text-orange-500 flex-shrink-0" /> 7. Yasaklanan Kullanımlar
                            </h2>
                            <p className="text-gray-400 leading-relaxed">Aşağıdaki eylemler kesinlikle yasaktır:</p>
                            <ul className="list-disc pl-6 mt-4 text-gray-400 space-y-2">
                                <li>Uygulamanın kaynak kodunu çözmeye, tersine mühendislik yapmaya veya değiştirmeye çalışmak.</li>
                                <li>Platform güvenlik önlemlerini aşmaya veya atlatmaya teşebbüs etmek.</li>
                                <li>Otomatik araçlar, botlar veya scraperlar kullanarak içeriğe erişmek.</li>
                                <li>İçerikleri kaydetmek, indirmek veya izinsiz yeniden dağıtmak.</li>
                                <li>Platform altyapısına zarar verecek şekilde aşırı yük oluşturmak.</li>
                            </ul>
                        </div>

                        {/* 8. Sorumluluk Sınırlaması */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <ShieldCheck className="text-orange-500 flex-shrink-0" /> 8. Sorumluluk Sınırlaması ve Garanti Reddi
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Uygulama ve tüm içerikler &quot;olduğu gibi&quot; sunulmaktadır. Culinora, Uygulamanın kesintisiz veya hatasız 
                                çalışacağını garanti etmez. Yasaların izin verdiği azami ölçüde:
                            </p>
                            <ul className="list-disc pl-6 mt-4 text-gray-400 space-y-2">
                                <li>Culinora, doğrudan, dolaylı, arızi, özel veya sonuç olarak ortaya çıkan zararlardan sorumlu değildir.</li>
                                <li>İçeriklerin doğruluğu, eksiksizliği veya güncelliği konusunda garanti verilmemektedir.</li>
                                <li>Üçüncü taraf hizmetleri veya bağlantıları üzerinden yaşanan sorunlardan Culinora sorumlu değildir.</li>
                            </ul>
                        </div>

                        {/* 9. Üçüncü Taraf Hizmetleri */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Globe className="text-orange-500 flex-shrink-0" /> 9. Üçüncü Taraf Hizmetleri
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Uygulama, üçüncü taraf hizmetlerini (ödeme işlemcileri, analiz araçları vb.) kullanabilir. 
                                Bu hizmetlerin kullanımı, ilgili üçüncü tarafların kendi kullanım koşullarına ve gizlilik politikalarına tabidir.
                                Apple Inc. bu sözleşmenin tarafı değildir; ancak Apple ve bağlı kuruluşları bu sözleşmenin üçüncü taraf yararlanıcılarıdır.
                            </p>
                        </div>

                        {/* 10. Hesap Feshi */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <AlertCircle className="text-orange-500 flex-shrink-0" /> 10. Hesap Askıya Alma ve Fesih
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Culinora, bu koşulların ihlali durumunda, önceden bildirimde bulunarak veya bulunmaksızın, 
                                hesabınızı askıya alabilir veya tamamen feshedebilir. Fesih durumunda:
                            </p>
                            <ul className="list-disc pl-6 mt-4 text-gray-400 space-y-2">
                                <li>Uygulamayı kullanma lisansınız derhal sona erer.</li>
                                <li>Aktif aboneliğiniz mevcut dönemin sonuna kadar geçerliliğini korur.</li>
                                <li>Hesabınızla ilişkili veriler gizlilik politikamıza uygun şekilde işlenir.</li>
                            </ul>
                        </div>

                        {/* 11. Değişiklikler */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Gavel className="text-orange-500 flex-shrink-0" /> 11. Uygulanacak Hukuk ve Değişiklikler
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Bu sözleşme, Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıkların çözümünde Türkiye Cumhuriyeti 
                                mahkemeleri ve icra daireleri yetkilidir.
                            </p>
                            <p className="text-gray-400 leading-relaxed mt-3">
                                Culinora, bu kullanım koşullarını herhangi bir zamanda güncelleme hakkını saklı tutar. 
                                Önemli değişiklikler uygulama içi bildirimler veya e-posta yoluyla kullanıcılara duyurulacaktır. 
                                Değişikliklerden sonra Uygulamayı kullanmaya devam etmeniz, güncellenmiş koşulları kabul ettiğiniz anlamına gelir.
                            </p>
                        </div>

                        {/* 12. Apple Özel Koşulları */}
                        <div className="bg-gray-900/30 p-8 rounded-2xl border border-orange-500/30">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <ShieldCheck className="text-orange-500 flex-shrink-0" /> 12. Apple Cihazlarına Özel Koşullar
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Uygulamayı Apple App Store üzerinden indirdiyseniz, aşağıdaki ek koşullar geçerlidir:
                            </p>
                            <ul className="list-disc pl-6 mt-4 text-gray-400 space-y-2">
                                <li>Bu sözleşme siz ve Culinora arasında akdedilmiş olup, Apple Inc. bu sözleşmenin tarafı değildir.</li>
                                <li>Apple, Uygulama için herhangi bir bakım veya destek hizmeti sağlama yükümlülüğü altında değildir.</li>
                                <li>Uygulamanın herhangi bir garanti şartına uymaması durumunda, Apple&apos;ın azami sorumluluğu satın alma bedelinin iadesi ile sınırlıdır.</li>
                                <li>Apple, Uygulamanın üçüncü tarafların fikri mülkiyet haklarını ihlal ettiğine ilişkin iddiaları ele almakla yükümlü değildir.</li>
                                <li>Apple ve bağlı kuruluşları, bu sözleşmenin üçüncü taraf yararlanıcılarıdır ve sözleşmeyi kabul etmeniz üzerine bu koşulları size karşı ileri sürme hakkına sahiptir.</li>
                                <li>Uygulama kullanımınız, Apple Medya Hizmetleri Hüküm ve Koşullarında belirtilen Kullanım Kurallarına da tabidir.</li>
                            </ul>
                        </div>

                        {/* İletişim */}
                        <div className="bg-orange-600/10 border border-orange-500/20 p-8 rounded-2xl">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                                <Mail className="text-orange-500 flex-shrink-0" /> İletişim
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                Bu Kullanım Koşulları hakkında sorularınız varsa veya haklarınızı kullanmak istiyorsanız, 
                                aşağıdaki kanallar üzerinden bizimle iletişime geçebilirsiniz:
                            </p>
                            <div className="mt-4 space-y-2 text-gray-400">
                                <p><strong className="text-white">E-posta:</strong> info@culinora.net</p>
                                <p><strong className="text-white">Platform:</strong> culinora.net</p>
                            </div>
                        </div>

                        {/* İlgili Belgeler */}
                        <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-800">
                            <h3 className="text-lg font-semibold text-white mb-4">İlgili Belgeler</h3>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/privacy" className="text-orange-500 hover:text-orange-400 underline transition-colors">
                                    Gizlilik Politikası
                                </Link>
                                <span className="text-gray-700">•</span>
                                <Link href="/iptal-iade" className="text-orange-500 hover:text-orange-400 underline transition-colors">
                                    İptal ve İade Politikası
                                </Link>
                                <span className="text-gray-700">•</span>
                                <Link href="/mesafeli-satis-sozlesmesi" className="text-orange-500 hover:text-orange-400 underline transition-colors">
                                    Mesafeli Satış Sözleşmesi
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
