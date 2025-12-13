"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserCheck,
  Mail,
  Calendar,
  BookOpen,
  GraduationCap
} from "lucide-react"


interface User {
  id: string
  name: string | null
  email: string
  role: string
  image?: string | null
  createdAt: Date
  subscriptionPlan: string | null
  _count: {
    createdCourses: number
    enrollments: number
    reviews: number
  }
}

interface UserManagementProps {
  users: User[]
}

const SUBSCRIPTION_LABELS: Record<string, { label: string, color: string }> = {
  'COMMIS': { label: 'Commis', color: 'bg-orange-500 text-white' },
  'CHEF_DE_PARTIE': { label: 'Chef de P.', color: 'bg-blue-500 text-white' },
  'EXECUTIVE': { label: 'Executive', color: 'bg-purple-500 text-white' }
}

export default function UserManagement({ users }: UserManagementProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Filtreleme
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

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
        router.refresh()
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
      STUDENT: { color: 'bg-green-900/50 text-green-200 border-green-700/50', text: 'Öğrenci', icon: GraduationCap }
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
      { value: 'ADMIN', label: 'Admin', icon: Shield }
    ]

    return allRoles.filter(role => role.value !== currentRole)
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <Users className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.length}</p>
              <p className="text-gray-400">Toplam Kullanıcı</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'STUDENT').length}</p>
              <p className="text-gray-400">Öğrenci</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'INSTRUCTOR').length}</p>
              <p className="text-gray-400">Eğitmen</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'ADMIN').length}</p>
              <p className="text-gray-400">Yönetici</p>
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
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left bg-black/20">
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">Kullanıcı</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">Rol & Abonelik</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">İstatistikler</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm">Kayıt Tarihi</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-sm text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.image ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-800"
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
                          {user.name || 'İsimsiz Kullanıcı'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-0.5">
                          <Mail className="h-3 w-3 mr-1.5" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-2">
                      {getRoleBadge(user.role)}
                      {user.subscriptionPlan && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${SUBSCRIPTION_LABELS[user.subscriptionPlan]?.color ? 'bg-opacity-20 ' + SUBSCRIPTION_LABELS[user.subscriptionPlan].color.replace('text-white', 'border-current') : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                          {SUBSCRIPTION_LABELS[user.subscriptionPlan]?.label || user.subscriptionPlan}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-6 text-sm text-gray-400">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-white">{user._count.createdCourses}</span>
                        <span className="text-[10px]">Kurs</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-white">{user._count.enrollments}</span>
                        <span className="text-[10px]">Kayıt</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-white">{user._count.reviews}</span>
                        <span className="text-[10px]">Yorum</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                      {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
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
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
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
