import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Users, Wallet, TrendingUp, Clock, Award, Info } from "lucide-react"

// Örnek veriler (şu an sistem dakika verisi olmadığı için)
const sampleInstructors = [
    {
        id: "1",
        name: "Şef Ahmet Yılmaz",
        courseName: "Temel Mutfak Teknikleri",
        level: "Commis",
        minutes: 120,
        coefficient: 1,
        color: "#f97316" // orange-500
    },
    {
        id: "2",
        name: "Şef Mehmet Kaya",
        courseName: "İleri Pişirme Teknikleri",
        level: "Chef de Partie",
        minutes: 90,
        coefficient: 2,
        color: "#3b82f6" // blue-500
    },
    {
        id: "3",
        name: "Şef Ayşe Demir",
        courseName: "Executive Master Class",
        level: "Executive",
        minutes: 60,
        coefficient: 3,
        color: "#a855f7" // purple-500
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
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="bg-green-500/20 p-3 rounded-xl">
                            <Wallet className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">₺{POOL_TOTAL.toLocaleString('tr-TR')}</p>
                            <p className="text-gray-400 text-sm font-medium">Toplam Havuz</p>
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
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="bg-orange-500/20 p-3 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{totalPoints}</p>
                            <p className="text-gray-400 text-sm font-medium">Toplam Etkileşim</p>
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
                            <p className="text-3xl font-bold text-white">{sampleInstructors.length}</p>
                            <p className="text-gray-400 text-sm font-medium">Aktif Eğitmen</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gelir Dağılımı (Pie Chart) */}
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
                            {poolData.map((instructor) => (
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

                {/* Detaylar ve Katsayılar */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Katsayı Bilgisi */}
                    <div className="bg-gradient-to-r from-neutral-900 to-black border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center mb-6 gap-2">
                            <Award className="h-5 w-5 text-orange-500" />
                            <h3 className="text-lg font-semibold text-white">Katsayı Sistemi</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 hover:border-orange-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-400 text-sm">Başlangıç</span>
                                    <span className="text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded text-xs">1×</span>
                                </div>
                                <h4 className="text-white font-medium mb-1">Commis</h4>
                                <p className="text-xs text-gray-500">Dakika başına 1 puan kazandırır.</p>
                            </div>
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-400 text-sm">Orta Seviye</span>
                                    <span className="text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded text-xs">2×</span>
                                </div>
                                <h4 className="text-white font-medium mb-1">Chef de Partie</h4>
                                <p className="text-xs text-gray-500">Dakika başına 2 puan kazandırır.</p>
                            </div>
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 hover:border-purple-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-400 text-sm">Usta</span>
                                    <span className="text-purple-500 font-bold bg-purple-500/10 px-2 py-0.5 rounded text-xs">3×</span>
                                </div>
                                <h4 className="text-white font-medium mb-1">Executive</h4>
                                <p className="text-xs text-gray-500">Dakika başına 3 puan kazandırır.</p>
                            </div>
                        </div>
                    </div>

                    {/* Detay Tablosu */}
                    <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">Hesaplama Detayları</h2>
                            <div className="flex items-center text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full">
                                <Info className="w-3 h-3 mr-1.5" />
                                Canlı veriler ile otomatik güncellenir
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Eğitmen</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Süre</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Katsayı</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Puan</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Hakediş</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {poolData.map((instructor) => (
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
                                                <span className="bg-gray-800 px-2 py-1 rounded text-xs font-mono">{instructor.minutes} dk</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${instructor.level === 'Executive' ? 'text-purple-400 bg-purple-400/10' :
                                                        instructor.level === 'Chef de Partie' ? 'text-blue-400 bg-blue-400/10' :
                                                            'text-orange-400 bg-orange-400/10'
                                                    }`}>
                                                    ×{instructor.coefficient} ({instructor.level})
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="text-sm font-bold text-white">{instructor.points}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-bold text-green-400">₺{instructor.poolShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
