import Link from "next/link"
import { Users, Eye, DollarSign } from "lucide-react"
// Simplified interface


interface InstructorData {
  totalPool: number
  instructorWatchMinutes: number
  systemWatchMinutes: number
  shareAmount: number
  sharePercentage: number
}

interface Session {
  user: {
    id: string
    name?: string | null | undefined
    email?: string | null | undefined
    image?: string | null | undefined
    role?: string | undefined
  }
}

interface Props {
  instructorData: InstructorData
  session: Session
}

export default function InstructorDashboardClient({ instructorData, session }: Props) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Page Header */}
      <div className="bg-gray-800 border-b border-gray-700 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Eğitmen Havuz Paneli</h1>
              <p className="text-gray-400">Hoş geldin, {session.user.name}</p>
            </div>
            <Link href="/home" className="text-gray-400 hover:text-white transition-colors">
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1: Toplam Havuz */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="h-24 w-24 text-blue-500" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Toplam Havuz</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-white">₺{instructorData.totalPool.toLocaleString('tr-TR')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-4">Sistemdeki tüm kurs gelirleri</p>
            </div>
          </div>

          {/* Card 2: İzlenme Süresi */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg relative overflow-hidden group hover:border-orange-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Eye className="h-24 w-24 text-orange-500" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">İzlenme Süreniz</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-white">{instructorData.instructorWatchMinutes}</span>
                <span className="text-lg text-gray-400">dk</span>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <div className="w-full bg-gray-700 rounded-full h-1.5 mr-2">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(instructorData.sharePercentage, 100)}%` }}
                  />
                </div>
                <span>%{instructorData.sharePercentage.toFixed(2)} Pay</span>
              </div>
            </div>
          </div>

          {/* Card 3: Hakediş */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg relative overflow-hidden group hover:border-green-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="h-24 w-24 text-green-500" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Tahmini Kazanç</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-green-500">₺{instructorData.shareAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
              </div>
              <p className="text-xs text-gray-500 mt-4">İzlenme oranınıza göre hesaplanan pay</p>
            </div>
          </div>

        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            * Ödemeler her ayın sonunda izlenme oranlarına göre otomatik hesaplanır.
          </p>
        </div>
      </div>
    </div>
  )
}
