import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChefHat, Award, Download, ArrowLeft, Calendar } from "lucide-react"

interface CertificatePageProps {
    params: Promise<{ id: string }>
}

async function getCertificate(id: string, userId: string) {
    return await prisma.certificate.findFirst({
        where: {
            id,
            userId // Ensure user can only view their own certificates
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            course: {
                select: {
                    title: true,
                    instructor: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    })
}

export default async function CertificateDetailPage({ params }: CertificatePageProps) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
        notFound()
    }

    const certificate = await getCertificate(id, session.user.id)

    if (!certificate) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="bg-gray-900/30 backdrop-blur-sm border-b border-gray-800 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href="/certificates"
                        className="flex items-center text-gray-300 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Sertifikalarıma Dön
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        İndir / Yazdır
                    </button>
                </div>
            </div>

            {/* Certificate Display */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-xl border-4 border-orange-500/30 p-12 shadow-2xl"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)'
                    }}
                >
                    {/* Certificate Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="bg-orange-500/20 p-4 rounded-full border-2 border-orange-500">
                                <Award className="h-16 w-16 text-orange-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-orange-500 uppercase tracking-wider mb-2">
                            Başarı Sertifikası
                        </h1>
                        <div className="w-32 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto"></div>
                    </div>

                    {/* Certificate Body */}
                    <div className="text-center space-y-6 mb-8">
                        <p className="text-gray-300 text-lg">
                            Bu sertifika ile onaylanır ki,
                        </p>

                        <div className="py-4 px-8 bg-black/30 rounded-lg border border-gray-800 inline-block">
                            <h2 className="text-3xl font-bold text-white">
                                {certificate.user.name || certificate.user.email}
                            </h2>
                        </div>

                        <p className="text-gray-300 text-lg">
                            aşağıdaki kursu başarıyla tamamlamıştır:
                        </p>

                        <div className="py-6 px-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/30">
                            <h3 className="text-2xl font-bold text-orange-400 mb-2">
                                {certificate.courseName}
                            </h3>
                            {certificate.course.instructor?.name && (
                                <p className="text-gray-400">
                                    Eğitmen: {certificate.course.instructor.name}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-center text-gray-400 pt-4">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                                Tamamlanma Tarihi: {new Date(certificate.issuedAt).toLocaleDateString('tr-TR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Certificate Footer */}
                    <div className="flex items-center justify-between pt-8 border-t border-gray-800">
                        <div className="text-center flex-1">
                            <div className="w-48 h-px bg-gray-700 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-500">Chef2.0 Platform</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <ChefHat className="h-8 w-8 text-orange-500" />
                            <span className="text-xl font-bold text-white">Chef2.0</span>
                        </div>
                        <div className="text-center flex-1">
                            <div className="w-48 h-px bg-gray-700 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-500">Sertifika No: {certificate.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Info Note */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Bu sertifika dijitaldir ve Chef2.0 platformu tarafından otomatik olarak oluşturulmuştur.</p>
                </div>
            </main>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          header, .no-print {
            display: none !important;
          }
        }
      `}</style>
        </div>
    )
}
