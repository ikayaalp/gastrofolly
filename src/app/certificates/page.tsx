import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChefHat, Award, Download, Calendar, BookOpen } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

async function getUserCertificates(userId: string) {
    return await prisma.certificate.findMany({
        where: { userId },
        include: {
            course: {
                select: {
                    title: true,
                    imageUrl: true,
                    instructor: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: { issuedAt: 'desc' }
    })
}

export default async function CertificatesPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/auth/signin")
    }

    const certificates = await getUserCertificates(session.user.id)

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-8">
                            <Link href="/home" className="flex items-center space-x-2">
                                <ChefHat className="h-8 w-8 text-orange-500" />
                                <span className="text-2xl font-bold">Chef2.0</span>
                            </Link>

                            {/* Navigation */}
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
                                <Link href="/chef-sor" className="text-gray-300 hover:text-white transition-colors">
                                    Chef&apos;e Sor
                                </Link>
                                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                                    İletişim
                                </Link>
                            </nav>
                        </div>

                        <UserDropdown />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-orange-500/20 p-3 rounded-xl">
                            <Award className="h-8 w-8 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Sertifikalarım</h1>
                            <p className="text-gray-400">Tamamladığınız kursların sertifikaları</p>
                        </div>
                    </div>
                </div>

                {/* Certificates Grid */}
                {certificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((certificate) => (
                            <Link
                                key={certificate.id}
                                href={`/certificates/${certificate.id}`}
                                className="group bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 hover:border-orange-500/50 transition-all duration-300 overflow-hidden hover:scale-105"
                            >
                                {/* Certificate Preview */}
                                <div className="relative h-48 bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center border-b border-gray-800">
                                    <div className="text-center p-6">
                                        <Award className="h-16 w-16 text-orange-500 mx-auto mb-3" />
                                        <h3 className="text-lg font-bold text-white line-clamp-2">
                                            {certificate.courseName}
                                        </h3>
                                    </div>
                                </div>

                                {/* Certificate Info */}
                                <div className="p-6">
                                    <div className="flex items-center text-sm text-gray-400 mb-3">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <span>
                                            {new Date(certificate.issuedAt).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    {certificate.course.instructor?.name && (
                                        <div className="flex items-center text-sm text-gray-400 mb-4">
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            <span>Eğitmen: {certificate.course.instructor.name}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-orange-500 font-semibold group-hover:text-orange-400 transition-colors">
                                            Sertifikayı Görüntüle
                                        </span>
                                        <Download className="h-4 w-4 text-orange-500 group-hover:text-orange-400 transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="bg-[#1e293b] rounded-xl p-12 border border-gray-700">
                            <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Henüz Sertifikanız Yok</h2>
                            <p className="text-gray-400 mb-6">
                                Bir kursu tamamladığınızda otomatik olarak sertifikanız oluşturulacak
                            </p>
                            <Link
                                href="/home"
                                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                            >
                                Kursları Keşfet
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
