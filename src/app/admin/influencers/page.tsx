"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Copy, TrendingUp, DollarSign, Search, Loader2, Star, X, Pencil, Check } from "lucide-react"
import { toast } from "react-hot-toast"

interface Influencer {
    id: string
    name: string
    email: string
    image: string | null
    referralCode: string
    discountPercent: number
    createdAt: string
    totalReferrals: number
    totalEarnings: number
    totalRevenue: number
    recentReferrals: {
        id: string
        amount: number
        commission: number
        createdAt: string
        referredUser: { name: string, email: string }
    }[]
}

export default function AdminInfluencersPage() {
    const [influencers, setInfluencers] = useState<Influencer[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [addEmail, setAddEmail] = useState("")
    const [addCode, setAddCode] = useState("")
    const [addDiscount, setAddDiscount] = useState("10")
    const [adding, setAdding] = useState(false)
    const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
    const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null)
    const [editCode, setEditCode] = useState("")
    const [editDiscount, setEditDiscount] = useState("10")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchInfluencers()
    }, [])

    const fetchInfluencers = async () => {
        try {
            const res = await fetch("/api/admin/influencers")
            const data = await res.json()
            if (data.influencers) {
                setInfluencers(data.influencers)
            }
        } catch (error) {
            toast.error("Influencer'lar yüklenemedi")
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async () => {
        if (!addEmail.trim()) {
            toast.error("Email gerekli")
            return
        }
        setAdding(true)
        try {
            const res = await fetch("/api/admin/influencers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: addEmail.trim(), referralCode: addCode.trim() || undefined, discountPercent: parseInt(addDiscount) || 10 })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`${data.influencer.name || data.influencer.email} influencer olarak atandı!`)
                setShowAddModal(false)
                setAddEmail("")
                setAddCode("")
                setAddDiscount("10")
                fetchInfluencers()
            } else {
                toast.error(data.error || "Bir hata oluştu")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setAdding(false)
        }
    }

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        toast.success("Referral kodu kopyalandı!")
    }

    const handleEditCode = async () => {
        if (!editingInfluencer || !editCode.trim()) {
            toast.error("Referral kodu boş olamaz")
            return
        }
        if (editCode.trim().length < 3) {
            toast.error("Referral kodu en az 3 karakter olmalı")
            return
        }
        setSaving(true)
        try {
            const res = await fetch("/api/admin/influencers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ influencerId: editingInfluencer.id, newReferralCode: editCode.trim(), discountPercent: parseInt(editDiscount) || 10 })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`Referral kodu güncellendi: ${data.influencer.referralCode}`)
                setEditingInfluencer(null)
                setEditCode("")
                fetchInfluencers()
            } else {
                toast.error(data.error || "Bir hata oluştu")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    const totalReferralsAll = influencers.reduce((s, i) => s + i.totalReferrals, 0)
    const totalEarningsAll = influencers.reduce((s, i) => s + i.totalEarnings, 0)
    const totalRevenueAll = influencers.reduce((s, i) => s + i.totalRevenue, 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Affiliate Yönetimi</h1>
                    <p className="text-gray-400 mt-1">Influencer'ları yönetin ve performanslarını takip edin</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Yeni Influencer Ekle
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-purple-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-purple-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                            <Star className="h-6 w-6 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Toplam Influencer</p>
                    <p className="text-3xl font-bold text-white mt-1">{influencers.length}</p>
                </div>

                <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                            <Users className="h-6 w-6 text-blue-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Getirilen Abone</p>
                    <p className="text-3xl font-bold text-white mt-1">{totalReferralsAll}</p>
                </div>

                <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-green-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-green-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-6 w-6 text-green-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Toplam Gelir (Referral)</p>
                    <p className="text-3xl font-bold text-white mt-1">₺{totalRevenueAll.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                </div>

                <div className="bg-black border border-gray-800 rounded-xl p-6 group hover:border-yellow-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-yellow-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                            <DollarSign className="h-6 w-6 text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Ödenen Komisyon</p>
                    <p className="text-3xl font-bold text-white mt-1">₺{totalEarningsAll.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                </div>
            </div>

            {/* Influencer Table */}
            <div className="bg-neutral-900/30 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">Influencer Listesi</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-black/40">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Influencer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral Kodu</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">İndirim</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Getirilen Abone</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Toplam Gelir</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Komisyon</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {influencers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Henüz influencer eklenmemiş
                                    </td>
                                </tr>
                            ) : influencers.map((inf) => (
                                <tr key={inf.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {inf.image ? (
                                                    <img className="h-10 w-10 rounded-full" src={inf.image} alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400">
                                                        {inf.name?.charAt(0) || "F"}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-white">{inf.name || "İsimsiz"}</p>
                                                <p className="text-xs text-gray-500">{inf.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <code className="bg-gray-800 text-orange-400 px-3 py-1 rounded-lg text-sm font-mono">{inf.referralCode}</code>
                                            <button onClick={() => copyCode(inf.referralCode)} className="text-gray-500 hover:text-white transition-colors" title="Kopyala">
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => { setEditingInfluencer(inf); setEditCode(inf.referralCode); setEditDiscount(String(inf.discountPercent || 10)); }} className="text-gray-500 hover:text-purple-400 transition-colors" title="Düzenle">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg text-sm font-semibold">%{inf.discountPercent || 10}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="text-white font-semibold">{inf.totalReferrals}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="text-green-400 font-semibold">₺{inf.totalRevenue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="text-yellow-400 font-semibold">₺{inf.totalEarnings.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => setSelectedInfluencer(inf)}
                                            className="text-sm text-orange-500 hover:text-orange-400 hover:underline"
                                        >
                                            Detay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Influencer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Yeni Influencer Ekle</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Kullanıcı Email</label>
                                <input
                                    type="email"
                                    value={addEmail}
                                    onChange={(e) => setAddEmail(e.target.value)}
                                    placeholder="influencer@email.com"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Referral Kodu (Opsiyonel)</label>
                                <input
                                    type="text"
                                    value={addCode}
                                    onChange={(e) => setAddCode(e.target.value.toUpperCase())}
                                    placeholder="Otomatik oluşturulacak"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-1">Boş bırakılırsa otomatik oluşturulur</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">İndirim Oranı (%)</label>
                                <input
                                    type="number"
                                    value={addDiscount}
                                    onChange={(e) => setAddDiscount(e.target.value)}
                                    placeholder="10"
                                    min="1"
                                    max="100"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Kullanıcıların alacağı indirim yüzdesi</p>
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={adding}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {adding ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Ekleniyor...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-5 w-5" />
                                        Influencer Olarak Ata
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Referral Code Modal */}
            {editingInfluencer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Influencer Düzenle</h3>
                            <button onClick={() => setEditingInfluencer(null)} className="text-gray-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Influencer</p>
                                <p className="text-white font-medium">{editingInfluencer.name || editingInfluencer.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Yeni Referral Kodu</label>
                                <input
                                    type="text"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                    placeholder="Yeni referral kodu"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-lg tracking-wider"
                                />
                                <p className="text-xs text-gray-500 mt-1">En az 3 karakter, otomatik büyük harfe çevrilir</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">İndirim Oranı (%)</label>
                                <input
                                    type="number"
                                    value={editDiscount}
                                    onChange={(e) => setEditDiscount(e.target.value)}
                                    placeholder="10"
                                    min="1"
                                    max="100"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Kullanıcıların alacağı indirim yüzdesi</p>
                            </div>
                            <button
                                onClick={handleEditCode}
                                disabled={saving || editCode.trim() === editingInfluencer.referralCode}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-5 w-5" />
                                        Kodu Güncelle
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedInfluencer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedInfluencer.name || "İsimsiz Influencer"}</h3>
                                <p className="text-sm text-gray-400">{selectedInfluencer.email}</p>
                            </div>
                            <button onClick={() => setSelectedInfluencer(null)} className="text-gray-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-black border border-gray-800 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-white">{selectedInfluencer.totalReferrals}</p>
                                <p className="text-xs text-gray-400 mt-1">Getirilen Abone</p>
                            </div>
                            <div className="bg-black border border-gray-800 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-green-400">₺{selectedInfluencer.totalRevenue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                                <p className="text-xs text-gray-400 mt-1">Toplam Gelir</p>
                            </div>
                            <div className="bg-black border border-gray-800 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-yellow-400">₺{selectedInfluencer.totalEarnings.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                                <p className="text-xs text-gray-400 mt-1">Komisyon</p>
                            </div>
                        </div>

                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Son Referral&apos;lar</h4>
                        {selectedInfluencer.recentReferrals.length === 0 ? (
                            <p className="text-gray-500 text-sm">Henüz referral yok</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedInfluencer.recentReferrals.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between bg-black border border-gray-800 rounded-lg p-3">
                                        <div>
                                            <p className="text-sm text-white font-medium">{r.referredUser.name || r.referredUser.email}</p>
                                            <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-green-400 font-semibold">₺{r.amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                                            <p className="text-xs text-yellow-400">+₺{r.commission.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} komisyon</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
