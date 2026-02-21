
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BookOpen, Users, Wallet, TrendingUp, CreditCard, ArrowUpRight, Activity } from "lucide-react"

async function getAdminData() {
  const [users, coursesCount, enrollments, payments, recentRegistrations] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        role: true,
      }
    }),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        subscriptionPlan: { not: null },
        createdAt: { gte: new Date('2026-02-21T00:00:00.000Z') }
      },
      _sum: { amount: true },
      _count: true
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true,
        subscriptionPlan: true,
        subscriptionEndDate: true,
      }
    })
  ])

  return { users, coursesCount, enrollments, payments, recentRegistrations }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // Admin kontrolü
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (user?.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  const { users, coursesCount, enrollments, payments, recentRegistrations } = await getAdminData()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Genel Bakış</h1>
          <p className="text-gray-400 mt-1">Sistem istatistikleri ve özet durumu</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
            <Activity className="w-3 h-3" />
            Sistem Çalışıyor
          </span>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-blue-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm font-medium">Toplam Kullanıcı</p>
          <p className="text-3xl font-bold text-white mt-1">{users.length}</p>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-green-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-green-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm font-medium">Toplam Kurs</p>
          <p className="text-3xl font-bold text-white mt-1">{coursesCount}</p>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-orange-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm font-medium">Toplam Kayıt</p>
          <p className="text-3xl font-bold text-white mt-1">{enrollments}</p>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-yellow-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-yellow-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <CreditCard className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm font-medium">Toplam Gelir</p>
          <p className="text-3xl font-bold text-white mt-1">₺{(85 + (payments._sum.amount || 0)).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Registrations Table */}
        <div className="lg:col-span-2 bg-neutral-900/30 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Son Kayıtlar</h2>
            <Link href="/admin/users" className="text-sm text-orange-500 hover:text-orange-400 hover:underline">
              Tümünü Gör
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol / Paket</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentRegistrations.map((user) => {
                  const isPremium = user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {user.image ? (
                              <img className="h-8 w-8 rounded-full" src={user.image} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                {user.name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-900/50 text-red-300 border border-red-800' :
                            user.role === 'INSTRUCTOR' ? 'bg-blue-900/50 text-blue-300 border border-blue-800' :
                              'bg-green-900/50 text-green-300 border border-green-800'
                            }`}>
                            {user.role}
                          </span>
                          {isPremium && (
                            <span className="inline-flex px-2 py-1 text-[10px] font-semibold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              PREMIUM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-neutral-900/30 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Hızlı İşlemler</h2>
            <div className="space-y-3">
              <Link href="/admin/courses?action=new" className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 transition-all group">
                <span className="text-gray-300 group-hover:text-white">Yeni Kurs Ekle</span>
                <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-orange-500" />
              </Link>
              <Link href="/admin/notifications" className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 transition-all group">
                <span className="text-gray-300 group-hover:text-white">Bildirim Gönder</span>
                <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-orange-500" />
              </Link>
              <Link href="/admin/pool" className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 transition-all group">
                <span className="text-gray-300 group-hover:text-white">Havuz Durumu</span>
                <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-orange-500" />
              </Link>
            </div>
          </div>

          <div className="bg-neutral-900/30 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Sistem Durumu</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Sunucu Durumu</span>
                <span className="text-green-500 font-medium">Aktif</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Veritabanı</span>
                <span className="text-green-500 font-medium">Bağlı</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Son Güncelleme</span>
                <span className="text-gray-400 font-medium">{new Date().toLocaleTimeString('tr-TR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
