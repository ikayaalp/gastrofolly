import Link from "next/link"
import { Users, Eye, DollarSign, ChefHat } from "lucide-react"
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
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold text-white">Chef2.0</span>
            </div>
            <nav className="flex space-x-8">
              <Link href="/home" className="text-gray-300 hover:text-orange-500 transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-orange-500 transition-colors">
                Hakkımızda
              </Link>
              <Link href="/instructor-dashboard" className="text-orange-500 font-semibold">
                Havuz Paneli
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-orange-500 transition-colors">
                İletişim
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-gray-300">Eğitmen</span>
              </div>
              <Link
                href="/instructor-dashboard/profile"
                className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <Users className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800">
        <div className="grid grid-cols-4 gap-1">
          <Link href="/home" className="flex flex-col items-center py-3 text-gray-400 hover:text-white transition-colors">
            <Eye className="h-5 w-5" />
            <span className="text-xs mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/instructor-dashboard" className="flex flex-col items-center py-3 text-orange-500">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs mt-1">Havuz</span>
          </Link>
          <Link href="/about" className="flex flex-col items-center py-3 text-gray-400 hover:text-white transition-colors">
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Hakkımızda</span>
          </Link>
          <Link href="/contact" className="flex flex-col items-center py-3 text-gray-400 hover:text-white transition-colors">
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">İletişim</span>
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-gray-800 border-b border-gray-700 pt-24 pb-8 md:mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Eğitmen Havuz Paneli</h1>
              <p className="text-gray-400">Hoş geldin, {session.user.name}</p>
            </div>
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
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Toplam Havuz Geliri</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-white">₺{instructorData.totalPool.toLocaleString('tr-TR')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-4">Platformdaki tüm kurs satışlarından toplanan gelir</p>
            </div>
          </div>

          {/* Card 2: İzlenme İstatistikleri (Detaylandırıldı) */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg relative overflow-hidden group hover:border-orange-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Eye className="h-24 w-24 text-orange-500" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">İzlenme Detayları</p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Sizin İzlenmeniz</span>
                    <span className="text-white font-bold">{instructorData.instructorWatchMinutes} dk</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(instructorData.sharePercentage, 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Toplam Sistem</span>
                    <span className="text-gray-300">{instructorData.systemWatchMinutes} dk</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div className="bg-gray-500 h-1 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-700 flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Pastadaki Payınız</span>
                  <span className="text-orange-500 font-bold text-lg">%{instructorData.sharePercentage.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Hakediş ve Pasta Grafiği */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-lg relative overflow-hidden group hover:border-green-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="h-24 w-24 text-green-500" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Net Kazanç Payı</p>
              <div className="flex items-baseline space-x-2 mb-6">
                <span className="text-4xl font-bold text-green-500">₺{instructorData.shareAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
              </div>

              {/* Basit Pasta Grafiği Görselleştirmesi (CSS ile) */}
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full border-4 border-green-500"
                    style={{
                      clipPath: `polygon(50% 50%, -50% -50%, 100% -50%, 100% 100%, -50% 100%, -50% 50%)`, // Basit bir görselleştirme, tam doğru açı için svg gerekir ama yüzdeyi metin olarak yazıyoruz
                      opacity: instructorData.sharePercentage > 0 ? 1 : 0
                    }}
                  ></div>
                  <span className="text-xs font-bold text-white">%{Math.round(instructorData.sharePercentage)}</span>
                </div>
                <div className="text-xs text-gray-400">
                  <p>Toplam havuzun</p>
                  <p className="text-green-500 font-bold">%{instructorData.sharePercentage.toFixed(2)}</p>
                  <p>kadarını alıyorsunuz.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            * Bu veriler canlıdır. Havuz büyüdükçe veya izlenme oranınız değiştikçe kazancınız anlık olarak güncellenir.
          </p>
        </div>
      </div>
    </div>
  )
}
