"use client"

import { useState, useMemo } from "react"
import {
    Mail,
    Search,
    Send,
    CheckCircle2,
    XCircle,
    Users,
    Loader2,
    Crown,
    Check
} from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string
    role: string
    subscriptionPlan: string | null
    createdAt: Date
}

interface MailManagementProps {
    users: User[]
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
    'COMMIS': 'Commis',
    'CHEF_DE_PARTIE': 'Chef de Partie',
    'EXECUTIVE': 'Executive'
}

export default function MailManagement({ users }: MailManagementProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 })
    const [sendResult, setSendResult] = useState<{
        success: number
        fail: number
        message: string
    } | null>(null)
    const [filterType, setFilterType] = useState<string>("all")

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())

            if (!matchesSearch) return false

            switch (filterType) {
                case "subscriber":
                    return !!user.subscriptionPlan
                case "free":
                    return !user.subscriptionPlan
                case "admin":
                    return user.role === "ADMIN"
                case "instructor":
                    return user.role === "INSTRUCTOR"
                default:
                    return true
            }
        })
    }, [users, searchTerm, filterType])

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev)
            if (next.has(userId)) {
                next.delete(userId)
            } else {
                next.add(userId)
            }
            return next
        })
    }

    const selectAll = () => {
        if (selectedUserIds.size === filteredUsers.length) {
            setSelectedUserIds(new Set())
        } else {
            setSelectedUserIds(new Set(filteredUsers.map(u => u.id)))
        }
    }

    const handleSend = async () => {
        if (selectedUserIds.size === 0 || !subject.trim() || !message.trim()) return

        setIsSending(true)
        setSendResult(null)
        setSendProgress({ sent: 0, total: selectedUserIds.size })

        try {
            const selectedUsers = users.filter(u => selectedUserIds.has(u.id))
            const recipients = selectedUsers.map(u => ({
                email: u.email,
                name: u.name
            }))

            const response = await fetch('/api/admin/send-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipients, subject, message })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Mail gönderimi başarısız')
            }

            setSendResult({
                success: data.successCount,
                fail: data.failCount,
                message: data.message
            })
            setSendProgress({ sent: data.successCount + data.failCount, total: selectedUserIds.size })

            // Başarılıysa formu temizle
            if (data.failCount === 0) {
                setSubject("")
                setMessage("")
                setSelectedUserIds(new Set())
            }
        } catch (error: any) {
            setSendResult({
                success: 0,
                fail: selectedUserIds.size,
                message: error.message
            })
        } finally {
            setIsSending(false)
        }
    }

    const allFilteredSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Mail className="h-7 w-7 text-orange-500" />
                        Mail Gönder
                    </h1>
                    <p className="text-gray-400 mt-1">Kullanıcılara toplu veya bireysel mail gönderin</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2">
                    <span className="text-gray-400 text-sm">Gönderici: </span>
                    <span className="text-orange-400 font-medium text-sm">info@culinora.net</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol: Kullanıcı Seçimi */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-gray-400" />
                                Alıcılar
                                {selectedUserIds.size > 0 && (
                                    <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                                        {selectedUserIds.size} seçili
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={selectAll}
                                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                            >
                                {allFilteredSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
                            </button>
                        </div>

                        {/* Arama */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="İsim veya e-posta ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-800 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>

                        {/* Filtreler */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { key: "all", label: "Tümü" },
                                { key: "subscriber", label: "Aboneler" },
                                { key: "free", label: "Ücretsiz" },
                                { key: "admin", label: "Admin" },
                                { key: "instructor", label: "Eğitmen" },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilterType(f.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === f.key
                                            ? "bg-orange-600 text-white"
                                            : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kullanıcı Listesi */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Kullanıcı bulunamadı
                            </div>
                        ) : (
                            filteredUsers.map(user => {
                                const isSelected = selectedUserIds.has(user.id)
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 transition-colors text-left ${isSelected ? "bg-orange-600/10" : "hover:bg-white/5"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                ? "bg-orange-600 border-orange-600"
                                                : "border-gray-600"
                                            }`}>
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {user.name || "İsimsiz"}
                                                </p>
                                                {user.subscriptionPlan && (
                                                    <Crown className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        {user.subscriptionPlan && (
                                            <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded border border-orange-700/30 flex-shrink-0">
                                                {SUBSCRIPTION_LABELS[user.subscriptionPlan] || user.subscriptionPlan}
                                            </span>
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-800 bg-black/30">
                        <p className="text-xs text-gray-500 text-center">
                            {filteredUsers.length} kullanıcı listelendi • {selectedUserIds.size} seçili
                        </p>
                    </div>
                </div>

                {/* Sağ: Mail İçeriği */}
                <div className="space-y-4">
                    <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-5">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Send className="h-5 w-5 text-gray-400" />
                            Mail İçeriği
                        </h2>

                        {/* Konu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Konu *
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Mail konusu..."
                                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>

                        {/* Mesaj */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Mesaj *
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={10}
                                placeholder="Mail içeriğinizi yazın... (her satır bir paragraf olarak gönderilecek)"
                                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none transition-colors"
                            />
                        </div>

                        {/* Gönderim Bilgisi */}
                        <div className="bg-black/50 border border-gray-800 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Seçili Alıcı</span>
                                <span className="text-white font-medium">{selectedUserIds.size} kişi</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Gönderici</span>
                                <span className="text-orange-400">Culinora &lt;info@culinora.net&gt;</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Gönderim</span>
                                <span className="text-gray-300">Tek tek (bireysel)</span>
                            </div>
                        </div>

                        {/* Gönder Butonu */}
                        <button
                            onClick={handleSend}
                            disabled={isSending || selectedUserIds.size === 0 || !subject.trim() || !message.trim()}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:shadow-none"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Gönderiliyor... ({sendProgress.sent}/{sendProgress.total})
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    {selectedUserIds.size > 0
                                        ? `${selectedUserIds.size} Kişiye Mail Gönder`
                                        : "Alıcı Seçin"}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Sonuç */}
                    {sendResult && (
                        <div className={`border rounded-2xl p-6 ${sendResult.fail === 0
                                ? "bg-green-900/20 border-green-700/50"
                                : sendResult.success === 0
                                    ? "bg-red-900/20 border-red-700/50"
                                    : "bg-yellow-900/20 border-yellow-700/50"
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                {sendResult.fail === 0 ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-400" />
                                )}
                                <h3 className="text-lg font-semibold text-white">
                                    {sendResult.fail === 0 ? "Tamamlandı!" : "Sonuç"}
                                </h3>
                            </div>
                            <p className="text-gray-300">{sendResult.message}</p>
                            {sendResult.success > 0 && (
                                <p className="text-green-400 text-sm mt-1">✅ {sendResult.success} başarılı</p>
                            )}
                            {sendResult.fail > 0 && (
                                <p className="text-red-400 text-sm mt-1">❌ {sendResult.fail} başarısız</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
