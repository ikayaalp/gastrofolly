import Link from "next/link";
import { ChefHat, Briefcase, Zap, Globe, Rocket, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";

export default async function CareersPage() {
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
                            <Link href={session?.user ? "/home" : "/"} className="text-gray-300 hover:text-orange-500">Ana Sayfa</Link>
                            <Link href="/about" className="text-gray-300 hover:text-orange-500">Hakkımızda</Link>
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
            <section className="pt-32 pb-20 bg-gradient-to-br from-orange-900/20 via-black to-purple-900/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6">Geleceği Birlikte <br /><span className="text-orange-500 italic">Pişirelim</span></h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                        Gastronominin dijital dönüşümüne liderlik eden ekibin bir parçası olun.
                        Mutfak sanatlarını teknolojiyle harmanlayarak dünyaya açıyoruz.
                    </p>
                </div>
            </section>

            {/* Why Us */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <Zap className="w-12 h-12 text-orange-500" />
                            <h3 className="text-2xl font-bold">Hızlı Büyüme</h3>
                            <p className="text-gray-400">Hızla büyüyen bir EdTech girişiminde sorumluluk alın ve her gün yeni şeyler öğrenin.</p>
                        </div>
                        <div className="space-y-4">
                            <Globe className="w-12 h-12 text-orange-500" />
                            <h3 className="text-2xl font-bold">Uzaktan Çalışma</h3>
                            <p className="text-gray-400">Esnek çalışma modelleri ile nerede olursanız olun ekibimizin bir parçası olun.</p>
                        </div>
                        <div className="space-y-4">
                            <Rocket className="w-12 h-12 text-orange-500" />
                            <h3 className="text-2xl font-bold">Etki Yaratın</h3>
                            <p className="text-gray-400">Milyonlarca kişinin mutfak hayallerine dokunan içerikler ve teknolojiler geliştirin.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-20 bg-gray-900/10 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold mb-12 flex items-center gap-4 italic uppercase tracking-wider">
                        <Briefcase className="text-orange-500" /> Açık Pozisyonlar
                    </h2>
                    <div className="space-y-4">
                        {[
                            { title: "Senior Full Stack Developer", team: "Engineering", type: "Remote" },
                            { title: "Gastronomi İçerik Editörü", team: "Content", type: "Hybrid" },
                            { title: "Büyüme Odaklı Pazarlama Uzmanı", team: "Marketing", type: "Remote" }
                        ].map((job, i) => (
                            <div key={i} className="group bg-gray-900/50 border border-gray-800 p-6 rounded-2xl flex items-center justify-between hover:bg-gray-800/50 transition-all cursor-pointer">
                                <div>
                                    <h4 className="text-xl font-bold mb-1 group-hover:text-orange-500 transition-colors uppercase italic">{job.title}</h4>
                                    <p className="text-gray-500 text-sm italic">{job.team} • {job.type}</p>
                                </div>
                                <div className="bg-orange-600/10 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                    <ArrowRight className="w-6 h-6 text-orange-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <p className="text-gray-500 text-sm">Aradığınız pozisyonu bulamadınız mı? Bize özgeçmişinizi gönderin: <span className="text-orange-500 italic font-bold">careers@culinora.net</span></p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
