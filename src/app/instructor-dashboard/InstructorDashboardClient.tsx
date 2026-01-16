"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Eye, DollarSign, ChefHat, Search } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import NotificationDropdown from "@/components/ui/NotificationDropdown"
import SearchModal from "@/components/ui/SearchModal"
// Simplified interface


interface InstructorData {
  totalPool: number
  instructorWatchMinutes: number
  systemWatchMinutes: number
  instructorTotalPoints: number
  systemTotalPoints: number
  shareAmount: number
  sharePercentage: number
  instructorCoefficient: number
  courseStats?: {
    title: string
    minutes: number
    points: number
  }[]
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
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">Eğitmen</span>
              </Link>
              <nav className="flex space-x-6">
                <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
                <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurslarım
                </Link>
                <Link href="/instructor-dashboard" className="text-white font-semibold">
                  Havuz Paneli
                </Link>
                <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                  Chef Sosyal
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  İletişim
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-300 hover:text-white transition-colors"
                title="Ara"
              >
                <Search className="h-5 w-5" />
              </button>
              <NotificationDropdown />
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar (Matching Home) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
          </Link>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 md:pt-24 pb-20 md:pb-0 min-h-screen bg-black">
        {/* Note: bg-black added to match Home */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Title (Optional or integrated) */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Havuz Paneli</h1>
            <p className="text-gray-400">Hoş geldin, {session.user.name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Toplam Havuz */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
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

            {/* Card 2: İzlenme İstatistikleri */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-lg relative overflow-hidden group hover:border-orange-500/50 transition-all duration-300">
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
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(instructorData.sharePercentage, 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Toplam Sistem</span>
                      <span className="text-gray-300">{instructorData.systemWatchMinutes} dk</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1">
                      <div className="bg-gray-600 h-1 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Pastadaki Payınız</span>
                    <span className="text-orange-500 font-bold text-lg">%{instructorData.sharePercentage.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Hakediş */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-lg relative overflow-hidden group hover:border-green-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="h-24 w-24 text-green-500" />
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Net Kazanç Payı</p>
                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-4xl font-bold text-green-500">₺{instructorData.shareAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full border-4 border-green-500"
                      style={{
                        clipPath: `polygon(50% 50%, -50% -50%, 100% -50%, 100% 100%, -50% 100%, -50% 50%)`,
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


          {/* Detailed Course Breakdown Table */}
          <div className="mt-12 bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Kurs Bazlı İzlenme Detayları
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Kurs Adı</th>
                    <th className="py-3 px-4 text-center">İzlenme (dk)</th>
                    <th className="py-3 px-4 text-center">Getirdiği Puan</th>
                    <th className="py-3 px-4 text-right">Havuz Puan Payı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {instructorData.courseStats && instructorData.courseStats.length > 0 ? (
                    instructorData.courseStats.map((stat, index) => {
                      // Contribution of this course's points to the TOTAL SYSTEM POINTS
                      const systemPointShare = instructorData.systemTotalPoints > 0
                        ? (stat.points / instructorData.systemTotalPoints) * 100
                        : 0;

                      return (
                        <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                          <td className="py-4 px-4 font-medium text-white">{stat.title}</td>
                          <td className="py-4 px-4 text-center font-mono text-gray-400">{stat.minutes} dk</td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-1 rounded">
                              {stat.points} Puan
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-orange-500 font-bold">%{systemPointShare.toFixed(4)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                        Henüz izlenme verisi bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              * Bu veriler canlıdır. Havuz büyüdükçe veya izlenme oranınız değiştikçe kazancınız anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Matching Home) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Eye className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            {/* BookOpen needs import if used, using Eye/Users available from current imports or strictly following Home structure */}
            {/* Note: I need to ensure I have BookOpen imported if I use it. Home uses standard Lucide icons. */}
            {/* Since I am preserving imports, I need to check if BookOpen, MessageCircle etc are available.
                 I will update imports in a separate step or just use generic icons I have for now to avoid errors.
                 I have Users, Eye, DollarSign, ChefHat. I need Home, BookOpen, MessageCircle.
                 I will use Users for Social, Eye for Home (temporary), DollarSign for Pool.
             */}
            <Eye className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/instructor-dashboard" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <DollarSign className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Havuz</span>
          </Link>
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">İletişim</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
