import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateNetRevenue, calculatePoolAmount } from "@/lib/revenueConfig"
import { Users, Wallet, TrendingUp, Clock, Info, Smartphone } from "lucide-react"
import { TURKISH_MONTHS_LONG } from "@/lib/monthlyRevenue"
import PoolPayoutButton from "./PoolPayoutButton"
import PoolMonthFilter from "./PoolMonthFilter"

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

// Next.js 15+ searchParams Promise handling
export default async function PoolManagementPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams
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

    // Tarih filtreleme
    const now = new Date()
    const selectedMonth = searchParams?.month ? parseInt(searchParams.month as string) : now.getMonth() + 1
    const selectedYear = searchParams?.year ? parseInt(searchParams.year as string) : now.getFullYear()

    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0))
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999))

    // Ayın ödemelerini getir
    const payments = await prisma.payment.findMany({
        where: {
            status: 'COMPLETED',
            subscriptionPlan: { not: null },
            createdAt: { gte: startDate, lte: endDate }
        }
    })

    let totalGrossRevenue = 0
    let totalNetRevenue = 0
    let webGross = 0
    let webNet = 0
    let mobileGross = 0
    let mobileNet = 0
    
    payments.forEach(payment => {
        totalGrossRevenue += payment.amount
        const net = calculateNetRevenue(payment.amount, payment.platform)
        totalNetRevenue += net

        if (payment.platform === 'IYZICO' || payment.platform === 'STRIPE') {
            webGross += payment.amount
            webNet += net
        } else if (payment.platform === 'REVENUECAT_APPLE' || payment.platform === 'REVENUECAT_GOOGLE') {
            mobileGross += payment.amount
            mobileNet += net
        } else {
            // Eskiden platformu olmayanlar (backfill edilmemişse vs) web/iyzico varsayılabilir
            webGross += payment.amount
            webNet += net
        }
    })

    const POOL_TOTAL = calculatePoolAmount(totalNetRevenue)

    // Gerçek eğitmenleri veritabanından çek
    const instructorUsers = await prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        select: { id: true, name: true, image: true }
    })

    // Her eğitmen için gerçek ders sürelerini hesapla (sadece seçili ayda tamamlananlar)
    const colors = ["#f97316", "#3b82f6", "#a855f7", "#22c55e", "#ef4444", "#eab308"]

    const completedProgress = await prisma.progress.findMany({
        where: {
            isCompleted: true,
            completedAt: { gte: startDate, lte: endDate },
            lesson: {
                isPublished: true,
                duration: { not: null }
            }
        },
        include: { lesson: { select: { duration: true, course: { select: { instructorId: true } } } } }
    })

    const instructorMinutes: Record<string, number> = {}
    completedProgress.forEach(p => {
        const instId = p.lesson.course.instructorId
        const dur = p.lesson.duration || 0
        instructorMinutes[instId] = (instructorMinutes[instId] || 0) + dur
    })

    const instructorsWithData = await Promise.all(
        instructorUsers.map(async (user, index) => {
            const minutes = instructorMinutes[user.id] || 0
            return {
                id: user.id,
                name: user.name || "İsimsiz Şef",
                courseName: "Aylık Toplam İzlenme",
                level: "Eğitmen",
                minutes,
                coefficient: 1,
                color: colors[index % colors.length]
            }
        })
    )

    // Payout durumlarını çek (Sadece Admin için)
    const payouts = currentUser.role !== 'INSTRUCTOR' ? await prisma.instructorPayout.findMany({
        where: {
            month: selectedMonth,
            year: selectedYear
        }
    }) : []
    const paidInstructorIds = new Set(payouts.filter(p => p.status === 'PAID').map(p => p.instructorId))

    const poolData = calculatePoolShare(instructorsWithData, POOL_TOTAL)
    const totalMinutes = instructorsWithData.reduce((sum, i) => sum + i.minutes, 0)

    // Pasta grafik
    let gradientAngle = 0
    const conicGradient = poolData.map((instructor: any) => {
        const startAngle = gradientAngle
        const endAngle = gradientAngle + (instructor.ratio * 360)
        gradientAngle = endAngle
        return `${instructor.color} ${startAngle}deg ${endAngle}deg`
    }).join(', ')

    // GÖRÜNÜRLÜK AYARLARI
    let displayedInstructors = poolData
    const isInstructor = currentUser.role === 'INSTRUCTOR'

    if (isInstructor) {
        displayedInstructors = poolData.filter((i: any) => i.id === currentUser.id)
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Eğitmen Gelir Havuzu</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {TURKISH_MONTHS_LONG[selectedMonth - 1]} {selectedYear} — aylık gelir ve dağıtım
                    </p>
                </div>
                <PoolMonthFilter
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    years={[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="bg-green-500/20 p-3 rounded-xl">
                            <Wallet className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">₺{POOL_TOTAL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                            <p className="text-gray-400 text-sm font-medium">Eğitmen Havuzu (%25)</p>
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

            {/* Abonelik Geliri Özeti: Brüt → Kesinti → Net → Havuz - SADECE ADMİN */}
            {!isInstructor && (
                <div className="bg-black border border-gray-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Abonelik Geliri Özeti — {TURKISH_MONTHS_LONG[selectedMonth - 1]} {selectedYear}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Toplam Brüt Gelir</p>
                            <p className="text-white text-2xl font-bold">₺{totalGrossRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</p>
                            <p className="text-gray-600 text-[11px] mt-1">Müşterinin ödediği tam tutar</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Platform Kesintisi</p>
                            <p className="text-red-400 text-2xl font-bold">−₺{(totalGrossRevenue - totalNetRevenue).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</p>
                            <p className="text-gray-600 text-[11px] mt-1">Apple %30 · Google %15 · Iyzico %3</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Net Gelir (Kalan)</p>
                            <p className="text-green-400 text-2xl font-bold">₺{totalNetRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</p>
                            <p className="text-gray-600 text-[11px] mt-1">Kesinti sonrası bize kalan</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Eğitmen Havuzu (%25)</p>
                            <p className="text-orange-400 text-2xl font-bold">₺{POOL_TOTAL.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</p>
                            <p className="text-gray-600 text-[11px] mt-1">Net gelirin %25'i</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Gelir Kaynağı Detayları - SADECE ADMİN GÖRÜR */}
            {!isInstructor && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center space-x-4 relative z-10 mb-4">
                            <div className="bg-orange-500/20 p-3 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">₺{webNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                                <p className="text-gray-400 text-sm font-medium">Web Abonelik Net Geliri</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-2 border-t border-gray-800 pt-2">
                            <span className="text-gray-500">Brüt Gelir:</span>
                            <span className="text-gray-400">₺{webGross.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>

                    <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center space-x-4 relative z-10 mb-4">
                            <div className="bg-cyan-500/20 p-3 rounded-xl">
                                <Smartphone className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">₺{mobileNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                                <p className="text-gray-400 text-sm font-medium">Mobil Abonelik Net Geliri</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-2 border-t border-gray-800 pt-2">
                            <span className="text-gray-500">Brüt Gelir:</span>
                            <span className="text-gray-400">₺{mobileGross.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>
            )}

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
                                        {!isInstructor && <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">İşlem</th>}
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
                                                {!isInstructor && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {instructor.poolShare > 0 ? (
                                                            <PoolPayoutButton 
                                                                instructorId={instructor.id}
                                                                month={selectedMonth}
                                                                year={selectedYear}
                                                                amount={instructor.poolShare}
                                                                isPaid={paidInstructorIds.has(instructor.id)}
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                )}
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
