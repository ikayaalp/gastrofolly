import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Wallet, TrendingUp, BookOpen, BarChart3 } from "lucide-react"
import RevenueChart from "@/components/admin/analytics/RevenueChart"
import EnrollmentChart from "@/components/admin/analytics/EnrollmentChart"
import DropoffFunnelChart from "@/components/admin/analytics/DropoffFunnelChart"

const TURKISH_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function buildMonthlySeries(rows: { month: Date; total: number }[]) {
    const totalsByKey = new Map<string, number>()
    for (const row of rows) {
        const d = new Date(row.month)
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
        totalsByKey.set(key, Number(row.total) || 0)
    }

    const series: { month: string; total: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
        series.push({
            month: TURKISH_MONTHS[d.getUTCMonth()],
            total: totalsByKey.get(key) || 0,
        })
    }
    return series
}

async function getAnalyticsData(selectedCourseId?: string) {
    const startOfMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))

    const [
        revenueRows,
        enrollmentRows,
        thisMonthRevenue,
        thisMonthEnrollments,
        activeCourseCount,
        topCourses,
    ] = await Promise.all([
        prisma.$queryRaw<{ month: Date; total: number }[]>`
            SELECT DATE_TRUNC('month', "createdAt") as month, SUM(amount)::float as total
            FROM "Payment"
            WHERE status = 'COMPLETED' AND "createdAt" >= NOW() - INTERVAL '12 months'
            GROUP BY month ORDER BY month ASC
        `,
        prisma.$queryRaw<{ month: Date; total: number }[]>`
            SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*)::float as total
            FROM "Enrollment"
            WHERE "createdAt" >= NOW() - INTERVAL '12 months'
            GROUP BY month ORDER BY month ASC
        `,
        prisma.payment.aggregate({
            where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
            _sum: { amount: true },
        }),
        prisma.enrollment.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.course.count({ where: { isPublished: true } }),
        prisma.course.findMany({
            orderBy: { enrollments: { _count: 'desc' } },
            take: 10,
            select: {
                id: true,
                title: true,
                _count: { select: { enrollments: true } },
                lessons: { where: { isPublished: true }, select: { id: true } },
            },
        }),
    ])

    const completedCounts = await prisma.progress.groupBy({
        by: ['courseId'],
        where: { isCompleted: true, courseId: { in: topCourses.map((c) => c.id) } },
        _count: { _all: true },
    })
    const completedByCourseId = new Map(completedCounts.map((c) => [c.courseId, c._count._all]))

    const topCoursesWithCompletion = topCourses.map((course) => {
        const enrollmentCount = course._count.enrollments
        const lessonCount = course.lessons.length
        const completedCount = completedByCourseId.get(course.id) || 0
        const completionRate =
            enrollmentCount > 0 && lessonCount > 0
                ? (completedCount / (enrollmentCount * lessonCount)) * 100
                : 0
        return {
            id: course.id,
            title: course.title,
            enrollmentCount,
            lessonCount,
            completionRate: Math.min(100, completionRate),
        }
    })

    const activeCourseId = selectedCourseId || topCoursesWithCompletion[0]?.id

    let dropoffData: { name: string; percentage: number }[] = []
    let activeCourse = null
    if (activeCourseId) {
        const course = await prisma.course.findUnique({
            where: { id: activeCourseId },
            select: {
                id: true,
                title: true,
                _count: { select: { enrollments: true } },
                lessons: {
                    where: { isPublished: true },
                    orderBy: { order: 'asc' },
                    select: { id: true, title: true, order: true },
                },
            },
        })

        if (course) {
            activeCourse = course
            const enrollmentCount = course._count.enrollments
            const lessonCompletions = await prisma.progress.groupBy({
                by: ['lessonId'],
                where: { isCompleted: true, lessonId: { in: course.lessons.map((l) => l.id) } },
                _count: { _all: true },
            })
            const completedByLessonId = new Map(lessonCompletions.map((l) => [l.lessonId, l._count._all]))

            dropoffData = course.lessons.map((lesson, index) => ({
                name: `${index + 1}. ${lesson.title}`,
                percentage: enrollmentCount > 0
                    ? Math.min(100, ((completedByLessonId.get(lesson.id) || 0) / enrollmentCount) * 100)
                    : 0,
            }))
        }
    }

    return {
        revenueSeries: buildMonthlySeries(revenueRows),
        enrollmentSeries: buildMonthlySeries(enrollmentRows),
        thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
        thisMonthEnrollments,
        activeCourseCount,
        topCoursesWithCompletion,
        dropoffData,
        activeCourse,
    }
}

export default async function AdminAnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ courseId?: string }>
}) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/auth/signin")
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })

    if (currentUser?.role !== 'ADMIN') {
        redirect("/dashboard")
    }

    const { courseId } = await searchParams
    const {
        revenueSeries,
        enrollmentSeries,
        thisMonthRevenue,
        thisMonthEnrollments,
        activeCourseCount,
        topCoursesWithCompletion,
        dropoffData,
        activeCourse,
    } = await getAnalyticsData(courseId)

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Analitik</h1>
                    <p className="text-gray-400 mt-1">Gelir, kayıt ve kurs tamamlanma verileri</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-green-500/30 transition-colors">
                    <div className="bg-green-500/20 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                        <Wallet className="h-6 w-6 text-green-400" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Bu Ay Gelir</p>
                    <p className="text-3xl font-bold text-white mt-1">
                        ₺{thisMonthRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-orange-500/30 transition-colors">
                    <div className="bg-orange-500/20 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-6 w-6 text-orange-400" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Bu Ay Kayıt</p>
                    <p className="text-3xl font-bold text-white mt-1">{thisMonthEnrollments}</p>
                </div>

                <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-blue-500/30 transition-colors">
                    <div className="bg-blue-500/20 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aktif Kurs</p>
                    <p className="text-3xl font-bold text-white mt-1">{activeCourseCount}</p>
                </div>
            </div>

            {/* Revenue + Enrollment trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-black border border-gray-800 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">Gelir Trendi (Son 12 Ay)</h2>
                    <RevenueChart data={revenueSeries} />
                </div>
                <div className="bg-black border border-gray-800 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">Kayıt Trendi (Son 12 Ay)</h2>
                    <EnrollmentChart data={enrollmentSeries} />
                </div>
            </div>

            {/* Top courses table */}
            <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">En Çok Kayıt Alan Kurslar</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Kurs</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Kayıt</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ders</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Tamamlanma</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {topCoursesWithCompletion.length > 0 ? (
                                topCoursesWithCompletion.map((course) => (
                                    <tr key={course.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-white">{course.title}</td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-300">{course.enrollmentCount}</td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-300">{course.lessonCount}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-white">%{course.completionRate.toFixed(1)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">
                                        Henüz veri bulunmuyor.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Drop-off funnel */}
            <div className="bg-black border border-gray-800 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-orange-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Ders Bazlı Tamamlanma (Drop-off)</h2>
                    </div>
                    <form method="GET" className="flex items-center gap-2">
                        <select
                            name="courseId"
                            defaultValue={activeCourse?.id}
                            className="bg-neutral-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                        >
                            {topCoursesWithCompletion.map((course) => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            Göster
                        </button>
                    </form>
                </div>
                <DropoffFunnelChart data={dropoffData} />
            </div>
        </div>
    )
}
