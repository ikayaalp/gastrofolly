// @ts-nocheck
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Users, Wallet, TrendingUp, Clock, Info } from "lucide-react"

function calculatePoolShare(instructors: any[], poolTotal: number) {
    const instructorsWithPoints = instructors.map(instructor => ({
        ...instructor,
        points: instructor.minutes
    }))
    const totalPoints = instructorsWithPoints.reduce((sum: number, i: any) => sum + i.points, 0)
    return instructorsWithPoints.map(instructor => ({
        ...instructor,
        ratio: totalPoints > 0 ? instructor.points / totalPoints : 0,
        percentage: totalPoints > 0 ? ((instructor.points / totalPoints) * 100).toFixed(1) : "0.0",
        poolShare: totalPoints > 0 ? (instructor.points / totalPoints) * poolTotal : 0
    }))
}

export default async function PoolManagementPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/auth/signin")
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, name: true }
    })

    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'INSTRUCTOR') {
        redirect("/dashboard")
    }

    // Gerçek havuz tutarı: 20 Şubat 2026 sonrası tamamlanmış abonelik ödemelerinin %25'i
    // (Öncesi iyzico test ödemeleriydi, resmi başlangıç: 20.02.2026)
    const completedPayments = await prisma.payment.aggregate({
        where: {
            status: 'COMPLETED',
            subscriptionPlan: { not: null },
            createdAt: { gt: new Date('2026-02-20T00:00:00.000Z') }
        },
        _sum: { amount: true }
    })
    const TOTAL_REVENUE = completedPayments._sum.amount || 0
    const POOL_TOTAL = TOTAL_REVENUE * 0.25

    // Gerçek eğitmenleri veritabanından çek
    const instructorUsers = await prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        select: { id: true, name: true, image: true }
    })

    // Her eğitmen için gerçek ders sürelerini hesapla
    const colors = ["#f97316", "#3b82f6", "#a855f7", "#22c55e", "#ef4444", "#eab308"]

    const instructorsWithData = await Promise.all(
        instructorUsers.map(async (user, index) => {
            // Kullanıcıların bu eğitmenin derslerinde tamamladığı dakikaların toplamı
            const completedProgress = await prisma.progress.findMany({
                where: {
                    isCompleted: true,
                    lesson: {
                        course: { instructorId: user.id },
                        isPublished: true,
                        duration: { not: null }
                    }
                },
                include: { lesson: { select: { duration: true } } }
            })
            const minutes = completedProgress.reduce((sum, p) => sum + (p.lesson.duration || 0), 0)

            return {
                id: user.id,
                name: user.name || "İsimsiz Şef",
                courseName: "Toplam İzlenme",
                level: "Eğitmen",
                minutes,
                coefficient: 1,
                color: colors[index % colors.length]
            }
        })
    )

    const poolData = calculatePoolShare(instructorsWithData, POOL_TOTAL)
    const totalMinutes = instructorsWithData.reduce((sum, i) => sum + i.minutes, 0)
    const totalPoints = poolData.reduce((sum: number, i: any) => sum + i.points, 0)


    // Pasta grafik (Sadece Admin veya toplamı görmek için)
    let gradientAngle = 0
    const conicGradient = poolData.map((instructor: any) => {
        const startAngle = gradientAngle
        const endAngle = gradientAngle + (instructor.ratio * 360)
        gradientAngle = endAngle
        return `${instructor.color} ${startAngle}deg ${endAngle}deg`
    }).join(', ')

    // GÖRÜNÜRLÜK AYARLARI
    // Admin hepsini görür.
    // Eğitmen sadece kendini görür.
    let displayedInstructors = poolData
    const isInstructor = currentUser.role === 'INSTRUCTOR'

    if (isInstructor) {
        displayedInstructors = poolData.filter((i: any) => i.id === currentUser.id)
    }

    return (
        <div className="space-y-8">
            {/* Stats Cards - HERKES GÖRÜR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Toplam Gelir - Sadece Admin */}
                {!isInstructor && (
                    <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center space-x-4 relative z-10">
                            <div className="bg-emerald-500/20 p-3 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">₺{TOTAL_REVENUE.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                                <p className="text-gray-400 text-sm font-medium">Toplam Gelir</p>
                                <p className="text-gray-600 text-xs">20 Şub 2026 sonrası</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="bg-green-500/20 p-3 rounded-xl">
                            <Wallet className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">₺{POOL_TOTAL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                            <p className="text-gray-400 text-sm font-medium">Eğitmen Havuzu (%25)</p>
                            <p className="text-gray-600 text-xs">20 Şub 2026 sonrası</p>
                        </div>
                    </div>
                </div>

                <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="bg-blue-500/20 p-3 rounded-xl">
                            <Clock className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{totalMinutes} dk</p>
                            <p className="text-gray-400 text-sm font-medium">Toplam İzlenme</p>
                        </div>
                    </div>
                </div>

                <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="bg-purple-500/20 p-3 rounded-xl">
                            <Users className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{instructorUsers.length}</p>
                            <p className="text-gray-400 text-sm font-medium">Aktif Eğitmen</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gelir Dağılımı (Pie Chart) - EĞİTMENDEN GİZLE */}
                {!isInstructor && (
                    <div className="lg:col-span-1 bg-black border border-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Gelir Dağılımı</h2>
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="relative">
                                <div
                                    className="w-64 h-64 rounded-full shadow-[0_0_50px_rgba(249,115,22,0.1)] transition-transform hover:scale-105 duration-500"
                                    style={{
                                        background: `conic-gradient(${conicGradient})`
                                    }}
                                />
                                <div className="absolute inset-0 m-auto w-32 h-32 bg-black rounded-full flex flex-col items-center justify-center border border-gray-800/50 backdrop-blur-sm">
                                    <span className="text-gray-400 text-xs">Toplam Dağıtılan</span>
                                    <span className="text-white font-bold text-lg mt-1">₺{POOL_TOTAL.toLocaleString('tr-TR', { notation: 'compact' })}</span>
                                </div>
                            </div>

                            <div className="w-full mt-8 space-y-3">
                                {displayedInstructors.map((instructor: any) => (
                                    <div key={instructor.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full shadow-[0_0_10px]"
                                                style={{ backgroundColor: instructor.color, boxShadow: `0 0 10px ${instructor.color}` }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-medium">{instructor.name}</span>
                                                <span className="text-[10px] text-gray-500">{instructor.percentage}% Pay</span>
                                            </div>
                                        </div>
                                        <span className="text-white font-bold text-sm">₺{instructor.poolShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Detay Tablosu */}
                <div className={`${isInstructor ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-0`}>
                    <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">
                                {isInstructor ? "Sizin Performansınız" : "Detaylı Rapor"}
                            </h2>
                            <div className="flex items-center text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full">
                                <Info className="w-3 h-3 mr-1.5" />
                                {isInstructor ? "Kişisel verileriniz" : "Otomatik hesaplanan veriler"}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Eğitmen</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">İzlenme Süresi</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Havuz Payı</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Hakediş Tutarı</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {displayedInstructors.length > 0 ? (
                                        displayedInstructors.map((instructor: any) => (
                                            <tr key={instructor.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-2 h-8 rounded-full mr-4 opacity-50 group-hover:opacity-100 transition-opacity"
                                                            style={{ backgroundColor: instructor.color }}
                                                        />
                                                        <div>
                                                            <div className="text-sm font-medium text-white">{instructor.name}</div>
                                                            <div className="text-xs text-gray-500">{instructor.courseName}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-300">
                                                    <div className="flex flex-col items-center">
                                                        <span className="bg-gray-800 px-2 py-1 rounded text-xs font-mono mb-1">{instructor.minutes} dk</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-bold text-white">%{instructor.percentage}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-xl font-bold text-green-400">₺{instructor.poolShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">
                                                Veri bulunamadı veya yetkiniz yok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
