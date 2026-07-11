import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, Mail, Calendar, CheckCircle, XCircle, Clock, Star } from "lucide-react"
import { isPremiumUser } from "@/lib/subscription"

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
        redirect("/dashboard")
    }

    const { userId } = await params

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            enrollments: { include: { course: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' } },
            payments: { orderBy: { createdAt: 'desc' }, include: { course: { select: { title: true } } } },
            certificates: { orderBy: { issuedAt: 'desc' } },
        }
    })

    if (!user) {
        notFound()
    }

    const isPremium = isPremiumUser(user)

    return (
        <div className="space-y-6">
            <div>
                <Link href="/admin/users" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kullanıcılara Dön
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">Kullanıcı Detayı</h1>
                <p className="text-gray-400">Kullanıcının kayıtları, ödemeleri ve sertifikaları.</p>
            </div>

            <div className="bg-black border border-gray-800 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0">
                            {user.image ? (
                                <img src={user.image} alt={user.name || "User"} className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user.name || 'İsimsiz Kullanıcı'}</h2>
                            <div className="flex items-center text-gray-400 mt-1">
                                <Mail className="w-4 h-4 mr-1.5" />
                                {user.email}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'INSTRUCTOR' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-800 text-gray-300'
                        }`}>
                            {user.role}
                        </span>
                        {isPremium && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 flex items-center gap-1">
                                <Star className="w-3 h-3" /> Aktif Premium
                            </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Kayıtlı Kurslar</h3>
                <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                    {user.enrollments.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-neutral-900 border-b border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-medium text-gray-400">Kurs Adı</th>
                                    <th className="px-6 py-4 text-sm font-medium text-gray-400">Kayıt Tarihi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.enrollments.map((e) => (
                                    <tr key={e.id} className="border-b border-gray-800 hover:bg-white/5">
                                        <td className="px-6 py-4 text-white font-medium">{e.course.title}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">{new Date(e.createdAt).toLocaleDateString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-6 text-center text-gray-500">Kayıtlı kurs bulunmuyor.</div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Ödeme Geçmişi</h3>
                <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                    {user.payments.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-neutral-900 border-b border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-medium text-gray-400">Tarih</th>
                                    <th className="px-6 py-4 text-sm font-medium text-gray-400">İçerik</th>
                                    <th className="px-6 py-4 text-sm font-medium text-gray-400">Tutar</th>
                                    <th className="px-6 py-4 text-sm font-medium text-gray-400 text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.payments.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-800 hover:bg-white/5">
                                        <td className="px-6 py-4 text-gray-300 text-sm">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</td>
                                        <td className="px-6 py-4 text-white">{p.course?.title || 'Abonelik'}</td>
                                        <td className="px-6 py-4 text-gray-300 font-medium">₺{p.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            {p.status === 'COMPLETED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Başarılı
                                                </span>
                                            ) : p.status === 'FAILED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                                    <XCircle className="w-3.5 h-3.5" /> Başarısız
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                                                    <Clock className="w-3.5 h-3.5" /> Bekliyor
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-6 text-center text-gray-500">Ödeme geçmişi bulunmuyor.</div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Sertifikalar</h3>
                <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                    {user.certificates.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-neutral-900 border-b border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-medium text-gray-400">Sertifika / Kurs</th>
                                    <th className="px-6 py-4 text-sm font-medium text-gray-400">Veriliş Tarihi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.certificates.map((c) => (
                                    <tr key={c.id} className="border-b border-gray-800 hover:bg-white/5">
                                        <td className="px-6 py-4 text-white font-medium">{c.courseName}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">{new Date(c.issuedAt).toLocaleDateString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-6 text-center text-gray-500">Kullanıcının henüz sertifikası bulunmuyor.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
