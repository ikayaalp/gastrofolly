import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChefHat, BookOpen, Users, Wallet, CreditCard, PlayCircle, BarChart3, TrendingUp, Home } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import PushNotificationSender from "@/components/admin/PushNotificationSender"

async function getAdminData() {
  const [users, courseList, coursesCount, enrollments, payments] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            createdCourses: true,
            payments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.payment.aggregate({
      _sum: {
        amount: true
      },
      _count: true
    })
  ])

  return { users, courseList, coursesCount, enrollments, payments }
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

  const { users, courseList, coursesCount, enrollments, payments } = await getAdminData()

  return (
    <div className="min-h-screen bg-black">
      {/* Desktop Header */}
      <header className="hidden md:block bg-gray-900/30 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
                <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin" className="text-white font-semibold">
                  Admin Paneli
                </Link>
                <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurs Yönetimi
                </Link>
                <Link href="/admin/users" className="text-gray-300 hover:text-white transition-colors">
                  Kullanıcı Yönetimi
                </Link>
                <Link href="/admin/pool" className="text-gray-300 hover:text-white transition-colors">
                  Havuz Yönetimi
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
            <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">Admin</span>
          </Link>
          <UserDropdown />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Paneli</h1>
          <p className="text-gray-400">Sistem istatistikleri ve kullanıcı yönetimi</p>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-gray-400">Toplam Kullanıcı</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{coursesCount}</p>
                <p className="text-gray-400">Toplam Kurs</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-500" /> {/* Changed from Calendar to TrendingUp */}
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{enrollments}</p>
                <p className="text-gray-400">Toplam Kayıt</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  ₺{payments._sum.amount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-gray-400">Toplam Gelir</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/admin/courses" className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Kurs Yönetimi</h3>
                <p className="text-gray-400">Kursları düzenle, yayınla ve yönet</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/users" className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Kullanıcı Yönetimi</h3>
                <p className="text-gray-400">Kullanıcıları yönet ve rollerini değiştir</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/pool" className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Havuz Yönetimi</h3>
                <p className="text-gray-400">Eğitmen gelir dağılımını görüntüle</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Push Notification Sender */}
        <div className="mb-8">
          <PushNotificationSender courses={courseList} />
        </div>

        {/* Kullanıcı Listesi */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Kayıtlı Kullanıcılar</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Kurslar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ödemeler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
                          <span className="text-lg">👨‍🍳</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.name || 'İsimsiz Kullanıcı'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-900 text-red-300' :
                        user.role === 'INSTRUCTOR' ? 'bg-blue-900 text-blue-300' :
                          'bg-green-900 text-green-300'
                        }`}>
                        {user.role === 'ADMIN' ? 'Yönetici' :
                          user.role === 'INSTRUCTOR' ? 'Eğitmen' : 'Öğrenci'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex flex-col">
                        <span>Kayıtlı: {user._count.enrollments}</span>
                        {user.role === 'INSTRUCTOR' && (
                          <span className="text-orange-400">Oluşturduğu: {user._count.createdCourses}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user._count.payments} ödeme
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/admin" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Panel</span>
          </Link>
          <Link href="/admin/courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslar</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kullanıcılar</span>
          </Link>
          <Link href="/admin/pool" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Wallet className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Havuz</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

