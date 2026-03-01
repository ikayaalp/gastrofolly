"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Users, Eye, DollarSign, ChefHat, Search, Home, BookOpen, MessageCircle } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import NotificationDropdown from "@/components/ui/NotificationDropdown"
import SearchModal from "@/components/ui/SearchModal"

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
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center gap-0.5">
                <div className="relative w-10 h-10">

                  <Image

                    src="/logo.jpeg"

                    alt="C"

                    fill

                    className="object-contain"

                  />

                </div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-orange-500">ulin</span>
                  <span className="text-white">ora</span>
                </span>
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
                  Panelim
                </Link>
                <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">
                  Culi
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

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center gap-0.5">
            <div className="relative w-8 h-8">

              <Image

                src="/logo.jpeg"

                alt="C"

                fill

                className="object-contain"

              />

            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-orange-500">ulin</span>
              <span className="text-white">ora</span>
            </span>
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
      <main className="pt-24 pb-20 md:pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Eğitmen Paneli</h1>
              <p className="text-gray-400">Hoş geldin, {session.user.name}</p>
            </div>
            {/* Quick Actions or Date could go here */}
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-sm text-gray-400">Toplam Puanınız:</span>
              <span className="ml-2 text-orange-500 font-bold">{instructorData.instructorTotalPoints}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Card 1: Toplam Havuz */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">Aktif</span>
                </div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Toplam Havuz Geliri</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl lg:text-4xl font-bold text-white">₺{instructorData.totalPool.toLocaleString('tr-TR')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Platform geneli toplam kurs geliri</p>
              </div>
            </div>

            {/* Card 2: İzlenme Payı */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-500/20 p-3 rounded-xl">
                    <Eye className="h-6 w-6 text-orange-400" />
                  </div>
                  <span className="text-xs font-mono text-orange-400 bg-orange-400/10 px-2 py-1 rounded">Canlı</span>
                </div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">İzlenme Payınız</p>

                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold text-white">{instructorData.instructorWatchMinutes} <span className="text-lg text-gray-500 font-normal">dk</span></span>
                  <span className="text-orange-500 font-bold mb-1">%{instructorData.sharePercentage.toFixed(2)}</span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(instructorData.sharePercentage, 100)}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Toplam {instructorData.systemWatchMinutes} dk içindeki payınız</p>
              </div>
            </div>

            {/* Card 3: Tahmini Kazanç */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500/20 p-3 rounded-xl">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">Net</span>
                </div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Tahmini Kazanç</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl lg:text-4xl font-bold text-green-400">₺{instructorData.shareAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Bu ayki toplam hakedişiniz</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-lg p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Kurs Bazlı Performans Raporu
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-gray-500 uppercase border-b border-gray-800">
                  <tr>
                    <th className="py-4 px-4 font-semibold">Kurs Adı</th>
                    <th className="py-4 px-4 text-center font-semibold">İzlenme Süresi</th>
                    <th className="py-4 px-4 text-center font-semibold">Toplam Puan</th>
                    <th className="py-4 px-4 text-right font-semibold">Havuz Katkısı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {instructorData.courseStats && instructorData.courseStats.length > 0 ? (
                    instructorData.courseStats.map((stat, index) => {
                      const contribution = instructorData.systemTotalPoints > 0
                        ? (stat.points / instructorData.systemTotalPoints) * 100
                        : 0;

                      return (
                        <tr key={index} className="hover:bg-white/5 transition-colors group">
                          <td className="py-4 px-4 font-medium text-white group-hover:text-blue-400 transition-colors">{stat.title}</td>
                          <td className="py-4 px-4 text-center font-mono text-sm">{stat.minutes} dk</td>
                          <td className="py-4 px-4 text-center">
                            <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs font-bold">
                              {stat.points}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-green-400 font-medium">%{contribution.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 italic">
                        Henüz izlenme verisi bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-xs">
              * Veriler anlık olarak güncellenmektedir. Dakika başına 1 puan kazanılmaktadır.
            </p>
          </div>

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
        <div className="flex justify-around items-center py-2 h-16">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-400 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-400 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/instructor-dashboard" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <Users className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Panelim</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-400 hover:text-white transition-colors">
            {/* Using Users or MessageCircle for Social */}
            <MessageCircle className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Sosyal</span>
          </Link>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  )
}
