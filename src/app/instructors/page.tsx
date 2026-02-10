import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Eğitmenler",
    description: "Culinora'nın profesyonel şef eğitmenleriyle tanışın. Ödüllü mutfaklardan gelen deneyimli eğitmenler.",
};
import { ChefHat, Star, Award, Users, BookOpen, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserDropdown from "@/components/ui/UserDropdown";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

export default async function InstructorsPage() {
    const session = await getServerSession(authOptions);

    // Fetch real instructors from database with their course stats
    const realInstructors = await (prisma as any).user.findMany({
        where: { role: "INSTRUCTOR" },
        select: {
            id: true,
            name: true,
            image: true,
            createdCourses: {
                select: {
                    id: true,
                    enrollments: { select: { id: true } },
                    reviews: { select: { rating: true } },
                },
            },
        },
    });

    const instructors = realInstructors.map((chef: any) => {
        let totalStudents = 0;
        let totalRating = 0;
        let reviewCount = 0;

        chef.createdCourses.forEach((course: any) => {
            totalStudents += course.enrollments.length;
            course.reviews.forEach((review: any) => {
                totalRating += review.rating;
                reviewCount++;
            });
        });

        const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : "0.0";

        return {
            id: chef.id,
            name: chef.name || "İsimsiz Şef",
            specialty: chef.createdCourses.length > 0 ? "Kıdemli Şef Eğitmeni" : "Eğitmen",
            description: `${chef.name || "Şefimiz"}, gastronomi alanındaki tecrübelerini Culinora öğrencileri ile paylaşıyor.`,
            image: chef.image || (chef.id.length % 2 === 0 ? "👨‍🍳" : "👩‍🍳"),
            rating: averageRating,
            students: totalStudents > 1000 ? `${(totalStudents / 1000).toFixed(1)}k+` : totalStudents.toString(),
        };
    });

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link href={session?.user ? "/home" : "/"} className="flex items-center space-x-2">
                            <ChefHat className="h-8 w-8 text-orange-500" />
                            <span className="text-2xl font-bold text-white uppercase italic tracking-tighter">Culinora</span>
                        </Link>
                        <nav className="hidden md:flex space-x-8">
                            <Link href={session?.user ? "/home" : "/"} className="text-gray-300 hover:text-orange-500 transition-all">Ana Sayfa</Link>
                            <Link href="/courses" className="text-gray-300 hover:text-orange-500 transition-all">Kurslar</Link>
                            <Link href="/about" className="text-gray-300 hover:text-orange-500 transition-all">Hakkımızda</Link>
                        </nav>
                        <div className="flex items-center space-x-4">
                            {session?.user ? (<UserDropdown />) : (
                                <Link href="/auth/signup" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all uppercase font-bold text-sm tracking-widest italic">Kayıt Ol</Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-20 bg-gradient-to-b from-gray-900 via-black to-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter">
                        Usta <span className="text-orange-500">Şeflerimiz</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                        Dünyaca ünlü restoranların mutfağından gelen, ödüllü ve tutkulu eğitmenlerimizle tanışın.
                        Onların deneyimiyle kendi mutfak hikayenizi yazın.
                    </p>
                </div>
            </section>

            {/* Instructors List */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {instructors.map((chef: any, i: number) => (
                            <div key={i} className="group relative bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 hover:border-orange-500 transition-all duration-500 hover:-translate-y-2">
                                <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-2xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                    {chef.image}
                                </div>
                                <h3 className="text-2xl font-bold text-center mb-2 tracking-wider">{chef.name}</h3>
                                <p className="text-orange-500 text-center font-medium mb-4">{chef.specialty}</p>
                                <p className="text-gray-400 text-center text-sm leading-relaxed mb-8">
                                    {chef.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-6">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-bold">{chef.rating}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Puanlama</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 text-white mb-1">
                                            <Users className="w-4 h-4" />
                                            <span className="font-bold">{chef.students}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Öğrenci</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Join as Instructor */}
            <section className="py-20 border-t border-gray-800 bg-gray-900/10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-600/30">
                    <div className="relative z-10">
                        <Award className="w-16 h-16 mx-auto mb-6" />
                        <h2 className="text-4xl font-extrabold mb-4 tracking-tighter">Eğitmenimiz Olun</h2>
                        <p className="text-xl mb-8 font-light max-w-2xl mx-auto">
                            Bilginizi paylaşın, topluluğumuza liderlik edin ve binlerce öğrencinin kariyerine yön verin.
                        </p>
                        <Link href="/contact" className="bg-black text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform inline-flex items-center gap-3">
                            Başvuru Yap <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                    {/* Decorative shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
