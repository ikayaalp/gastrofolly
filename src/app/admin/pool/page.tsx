import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChefHat, Users, BookOpen, Home, MessageCircle, Wallet, TrendingUp, Clock, Award } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

// Örnek veriler (şu an sistem dakika verisi olmadığı için)
const sampleInstructors = [
    {
        id: "1",
        name: "Şef Ahmet Yılmaz",
        courseName: "Temel Mutfak Teknikleri",
        level: "Commis",
        minutes: 120,
        coefficient: 1,
        color: "#3b82f6" // blue
    },
    {
        id: "2",
        name: "Şef Mehmet Kaya",
        courseName: "İleri Pişirme Teknikleri",
        level: "Chef de Partie",
        minutes: 90,
        coefficient: 2,
        color: "#10b981" // green
    },
    {
        id: "3",
        name: "Şef Ayşe Demir",
        courseName: "Executive Master Class",
        level: "Executive",
        minutes: 60,
        coefficient: 3,
        color: "#f59e0b" // amber
    }
]

// Havuz toplam (örnek)
const POOL_TOTAL = 50000 // ₺50,000

function calculatePoolShare(instructors: typeof sampleInstructors) {
    // Her eğitmen için puan hesapla
    const instructorsWithPoints = instructors.map(instructor => ({
        ...instructor,
        points: instructor.minutes * instructor.coefficient
    }))

    // Toplam puan
    const totalPoints = instructorsWithPoints.reduce((sum, i) => sum + i.points, 0)

    // Her eğitmenin oranı ve havuz payı
    return instructorsWithPoints.map(instructor => ({
        ...instructor,
        ratio: instructor.points / totalPoints,
        percentage: ((instructor.points / totalPoints) * 100).toFixed(1),
        poolShare: (instructor.points / totalPoints) * POOL_TOTAL
    }))
}

export default async function PoolManagementPage() {
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

    const poolData = calculatePoolShare(sampleInstructors)
    const totalMinutes = sampleInstructors.reduce((sum, i) => sum + i.minutes, 0)
    const totalPoints = poolData.reduce((sum, i) => sum + i.points, 0)

    // Pasta grafik için CSS conic-gradient oluştur
    let gradientAngle = 0
    const conicGradient = poolData.map((instructor, index) => {
        const startAngle = gradientAngle
        const endAngle = gradientAngle + (instructor.ratio * 360)
        gradientAngle = endAngle
        return `${instructor.color} ${startAngle}deg ${endAngle}deg`
    }).join(', ')

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
                                <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                                    Admin Paneli
                                </Link>
                                <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                                    Kurs Yönetimi
                                </Link>
                                <Link href="/admin/users" className="text-gray-300 hover:text-white transition-colors">
                                    Kullanıcı Yönetimi
                                </Link>
                                <Link href="/admin/pool" className="text-white font-semibold">
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
                    <h1 className="text-3xl font-bold text-white mb-2">Havuz Yönetimi</h1>
                    <p className="text-gray-400">Eğitmen gelir dağılımı ve puan hesaplaması</p>
                </div>

                {/* İstatistik Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <div className="flex items-center">
                            <Wallet className="h-8 w-8 text-green-500" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-white">₺{POOL_TOTAL.toLocaleString('tr-TR')}</p>
                                <p className="text-gray-400">Toplam Havuz</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-blue-500" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-white">{totalMinutes} dk</p>
                                <p className="text-gray-400">Toplam Dakika</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-orange-500" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-white">{totalPoints}</p>
                                <p className="text-gray-400">Toplam Puan</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-purple-500" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-white">{sampleInstructors.length}</p>
                                <p className="text-gray-400">Aktif Eğitmen</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Katsayı Bilgisi */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Katsayı Tablosu
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Commis</span>
                                <span className="text-2xl font-bold text-blue-400">1×</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Dakika başına 1 puan</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Chef de Partie</span>
                                <span className="text-2xl font-bold text-green-400">2×</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Dakika başına 2 puan</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Executive</span>
                                <span className="text-2xl font-bold text-amber-400">3×</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Dakika başına 3 puan</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pasta Grafik */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Gelir Dağılımı</h2>
                        <div className="flex flex-col items-center">
                            {/* Pie Chart */}
                            <div
                                className="w-64 h-64 rounded-full mb-6 shadow-2xl"
                                style={{
                                    background: `conic-gradient(${conicGradient})`
                                }}
                            />

                            {/* Legend */}
                            <div className="w-full space-y-3">
                                {poolData.map((instructor) => (
                                    <div key={instructor.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: instructor.color }}
                                            />
                                            <div>
                                                <p className="text-white font-medium">{instructor.name}</p>
                                                <p className="text-gray-500 text-sm">{instructor.courseName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-bold">{instructor.percentage}%</p>
                                            <p className="text-gray-400 text-sm">₺{instructor.poolShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Eğitmen Detay Tablosu */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Puan Hesaplama Detayı</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            Eğitmen
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            Seviye
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            Dakika
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            Katsayı
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            Puan
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            Pay
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {poolData.map((instructor) => (
                                        <tr key={instructor.id} className="hover:bg-gray-800/50">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-3 h-3 rounded-full mr-3"
                                                        style={{ backgroundColor: instructor.color }}
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{instructor.name}</div>
                                                        <div className="text-xs text-gray-500">{instructor.courseName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${instructor.level === 'Executive' ? 'bg-amber-900 text-amber-300' :
                                                    instructor.level === 'Chef de Partie' ? 'bg-green-900 text-green-300' :
                                                        'bg-blue-900 text-blue-300'
                                                    }`}>
                                                    {instructor.level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-300">
                                                {instructor.minutes} dk
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-300">
                                                ×{instructor.coefficient}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <span className="text-sm font-bold text-orange-400">{instructor.points}</span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-bold text-white">₺{instructor.poolShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                                                <div className="text-xs text-gray-500">{instructor.percentage}%</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-800/50">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-300">
                                            Toplam
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-bold text-white">
                                            {totalMinutes} dk
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-400">
                                            -
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-bold text-orange-400">
                                            {totalPoints}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-green-400">
                                            ₺{POOL_TOTAL.toLocaleString('tr-TR')}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Formül Açıklaması */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Hesaplama Formülü</h3>
                    <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
                        <p className="text-gray-300 mb-2">
                            <span className="text-orange-400">Puan</span> = Dakika × Katsayı
                        </p>
                        <p className="text-gray-300 mb-2">
                            <span className="text-orange-400">Oran</span> = Puan / Toplam Puan
                        </p>
                        <p className="text-gray-300">
                            <span className="text-orange-400">Havuz Payı</span> = Havuz Toplam × Oran
                        </p>
                    </div>
                    <p className="text-gray-500 text-sm mt-4">
                        * Bu sayfa örnek verilerle gösterilmektedir. Gerçek veriler sistemle entegre edildiğinde güncellenecektir.
                    </p>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
                <div className="flex justify-around items-center py-2">
                    <Link href="/admin" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
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
                    <Link href="/admin/pool" className="flex flex-col items-center py-2 px-3 text-orange-500">
                        <Wallet className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Havuz</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
