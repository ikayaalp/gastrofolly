"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserCheck,
  Mail,
  Calendar,
  GraduationCap,
  CreditCard,
  Sparkles,
  Star,
  Eye,
  Crown,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react"
import Image from "next/image"


interface User {
  id: string
  name: string | null
  email: string
  role: string
  image?: string | null
  createdAt: Date
  subscriptionPlan: string | null
  subscriptionStartDate: Date | null
  subscriptionEndDate: Date | null
  subscriptionCancelled: boolean
  payments: Array<{
    amount: number
    currency: string
  }>
  _count: {
    createdCourses: number
    enrollments: number
  }
}

interface UserManagementProps {
  initialFilter?: string
}

interface PaginationState {
  page: number
  limit: number
  total: number
  pages: number
}

interface StatsState {
  totalUsers: number
  premiumUsers: number
  activeSubscribers: number
  totalRevenue: number
}

const SUBSCRIPTION_LABELS: Record<string, { label: string, color: string }> = {
  'COMMIS': { label: 'Commis', color: 'bg-orange-900/40 text-orange-200 border-orange-700/50' },
  'CHEF_DE_PARTIE': { label: 'Chef de P.', color: 'bg-blue-900/40 text-blue-200 border-blue-700/50' },
  'EXECUTIVE': { label: 'Executive', color: 'bg-purple-900/40 text-purple-200 border-purple-700/50' }
}

export default function UserManagement({ initialFilter }: UserManagementProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [subFilter, setSubFilter] = useState(initialFilter === 'subscribers' ? 'ACTIVE' : 'ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const now = new Date()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 0, pages: 1 })
  const [stats, setStats] = useState<StatsState>({ totalUsers: 0, premiumUsers: 0, activeSubscribers: 0, totalRevenue: 0 })

  const loadData = async (currentPage: number, currentSearch: string, currentRole: string, currentSub: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${currentPage}&limit=20&search=${encodeURIComponent(currentSearch)}&role=${currentRole}&subFilter=${currentSub}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata oluştu:", error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search & filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(page, searchTerm, roleFilter, subFilter)
    }, 300)

    return () => clearTimeout(timer)
  }, [page, searchTerm, roleFilter, subFilter])

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, roleFilter, subFilter])

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        loadData(page, searchTerm, roleFilter, subFilter)
        setSelectedUser(null)
      } else {
        alert('Rol değiştirilirken bir hata oluştu.')
      }
    } catch (error) {
      console.error('Role update error:', error)
      alert('Rol değiştirilirken bir hata oluştu.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { color: 'bg-red-900/50 text-red-200 border-red-700/50', text: 'Admin', icon: Shield },
      INSTRUCTOR: { color: 'bg-blue-900/50 text-blue-200 border-blue-700/50', text: 'Eğitmen', icon: UserCheck },
      STUDENT: { color: 'bg-green-900/50 text-green-200 border-green-700/50', text: 'Öğrenci', icon: GraduationCap },
      INFLUENCER: { color: 'bg-purple-900/50 text-purple-200 border-purple-700/50', text: 'Fenomen', icon: Star }
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.STUDENT
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1.5" />
        {config.text}
      </span>
    )
  }

  const getRoleOptions = (currentRole: string) => {
    const allRoles = [
      { value: 'STUDENT', label: 'Öğrenci', icon: GraduationCap },
      { value: 'INSTRUCTOR', label: 'Eğitmen', icon: UserCheck },
      { value: 'ADMIN', label: 'Admin', icon: Shield },
      { value: 'INFLUENCER', label: 'Fenomen', icon: Star }
    ]

    return allRoles.filter(role => role.value !== currentRole)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const getUserTotalSpend = (user: User) => {
    return user.payments.reduce((sum, p) => sum + p.amount, 0)
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <Users className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-gray-400">Toplam Kullanıcı</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-white">%{(stats.totalUsers > 0 ? (stats.premiumUsers / stats.totalUsers) * 100 : 0).toFixed(1)}</p>
                <span className="text-sm text-gray-500">({stats.premiumUsers} üye)</span>
              </div>
              <p className="text-gray-400">Premium Oranı</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Crown className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.activeSubscribers}</p>
              <p className="text-gray-400">Aktif Abone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-white/5">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Kullanıcı adı veya e-posta ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-800 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none min-w-[160px]"
            >
              <option value="ALL">Tüm Roller</option>
              <option value="ADMIN">Admin</option>
              <option value="INSTRUCTOR">Eğitmen</option>
              <option value="STUDENT">Öğrenci</option>
              <option value="INFLUENCER">Fenomen</option>
            </select>
          </div>

          <div className="relative">
            <Crown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-800 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none min-w-[180px]"
            >
              <option value="ALL">Tüm Abonelikler</option>
              <option value="ACTIVE">Aktif Aboneler ({stats.activeSubscribers})</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-neutral-900/50 border border-white/5 rounded-2xl">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : (
      <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left bg-black/20">
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">Kullanıcı</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">Rol & Üyelik</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">Abonelik Detayı</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">Finansal</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">İstatistikler</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.image ? (
                          <Image
                            width={40}
                            height={40}
                            className="rounded-full object-cover ring-2 ring-gray-800"
                            src={user.image}
                            alt={user.name || 'User'}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center ring-2 ring-gray-800">
                            <span className="text-gray-300 font-semibold text-sm">
                              {user.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.name || 'İsimsiz'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-0.5">
                          <Mail className="h-3 w-3 mr-1.5" />
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-2">
                      {getRoleBadge(user.role)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.subscriptionPlan ? (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2 py-0.5 text-xs font-medium rounded border ${SUBSCRIPTION_LABELS[user.subscriptionPlan]?.color || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                          {SUBSCRIPTION_LABELS[user.subscriptionPlan]?.label || user.subscriptionPlan}
                        </span>
                        {user.subscriptionEndDate && (
                          <span className={`text-xs ${user.subscriptionCancelled ? 'text-red-400' : 'text-gray-400'}`}>
                            Bitiş: {new Date(user.subscriptionEndDate).toLocaleDateString('tr-TR')}
                            {user.subscriptionCancelled && ' (İptal)'}
                          </span>
                        )}
                        {/* Burada ödemelerden periyot tahmin edilebilir veya sadece plan adı gösterilebilir */}
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs">Standart Üyelik</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {formatCurrency(getUserTotalSpend(user))}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.payments.length} işlem
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-4 text-sm text-gray-400">
                      <div className="text-center">
                        <span className="block font-bold text-white">{user._count.enrollments}</span>
                        <span className="text-[10px]">Kayıt</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Detay"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {selectedUser?.id === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setSelectedUser(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-800 rounded-xl shadow-xl z-20 overflow-hidden">
                            <div className="py-1">
                              <div className="px-4 py-2 text-[10px] uppercase font-bold text-gray-500 bg-gray-900/50 border-b border-gray-800">
                                Rol Değiştir
                              </div>
                              {getRoleOptions(user.role).map((role) => {
                                const Icon = role.icon
                                return (
                                  <button
                                    key={role.value}
                                    onClick={() => handleRoleChange(user.id, role.value)}
                                    disabled={isUpdating}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center disabled:opacity-50"
                                  >
                                    <Icon className="h-4 w-4 mr-3 text-gray-400" />
                                    <span>{role.label} Yap</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Toplam <span className="font-medium text-white">{pagination.total}</span> sonuçtan <span className="font-medium text-white">{(page - 1) * pagination.limit + 1}-{Math.min(page * pagination.limit, pagination.total)}</span> arası gösteriliyor
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-white px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                  {page} / {pagination.pages}
                </span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="text-center py-20 bg-neutral-900/50 border border-white/5 rounded-2xl">
          <div className="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Kullanıcı bulunamadı</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            {searchTerm || roleFilter !== "ALL"
              ? "Arama kriterlerinize uygun kullanıcı bulunamadı."
              : "Henüz sisteme kayıtlı kullanıcı bulunmuyor."
            }
          </p>
        </div>
      )}
    </div>
  )
}
