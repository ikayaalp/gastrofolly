"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { Plus, Edit2, Trash2, Check, X, Loader2 } from "lucide-react"

type SubscriptionPlan = {
    id: string
    name: string
    price: number
    interval: string
    iyzicoPlanCode: string | null
    isActive: boolean
}

export default function SubscriptionManagement({ plans: initialPlans }: { plans: SubscriptionPlan[] }) {
    const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        interval: "monthly",
        iyzicoPlanCode: "",
        isActive: true
    })

    const handleOpenModal = (plan?: SubscriptionPlan) => {
        if (plan) {
            setEditingPlan(plan)
            setFormData({
                name: plan.name,
                price: plan.price.toString(),
                interval: plan.interval,
                iyzicoPlanCode: plan.iyzicoPlanCode || "",
                isActive: plan.isActive
            })
        } else {
            setEditingPlan(null)
            setFormData({
                name: "",
                price: "",
                interval: "monthly",
                iyzicoPlanCode: "",
                isActive: true
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const url = editingPlan 
                ? `/api/admin/subscriptions/${editingPlan.id}`
                : `/api/admin/subscriptions`
            
            const method = editingPlan ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    iyzicoPlanCode: formData.iyzicoPlanCode || null
                })
            })

            if (!res.ok) throw new Error("Bir hata oluştu")

            const savedPlan = await res.json()

            if (editingPlan) {
                setPlans(plans.map(p => p.id === savedPlan.id ? savedPlan : p))
                toast.success("Plan güncellendi")
            } else {
                setPlans([savedPlan, ...plans])
                toast.success("Plan oluşturuldu")
            }
            
            setIsModalOpen(false)
        } catch (error) {
            toast.error("İşlem başarısız")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bu planı silmek istediğinize emin misiniz?")) return
        
        try {
            const res = await fetch(`/api/admin/subscriptions/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Silinemedi")
            
            setPlans(plans.filter(p => p.id !== id))
            toast.success("Plan silindi")
        } catch (error) {
            toast.error("Silme işlemi başarısız")
        }
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Abonelik Planları</h1>
                    <p className="text-gray-400">Tüm abonelik planlarını ve fiyatlarını buradan yönetebilirsiniz.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Plan Ekle
                </button>
            </div>

            <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] border-b border-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400">Plan Adı</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400">Fiyat</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400">Periyot</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400">Iyzico Referans Kodu</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400">Durum</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(plan => (
                            <tr key={plan.id} className="border-b border-gray-800 hover:bg-white/5">
                                <td className="px-6 py-4 font-medium text-white">{plan.name}</td>
                                <td className="px-6 py-4 text-orange-400 font-bold">{plan.price} ₺</td>
                                <td className="px-6 py-4 text-gray-300">{plan.interval === 'monthly' ? 'Aylık' : 'Yıllık'}</td>
                                <td className="px-6 py-4 text-gray-400 font-mono text-sm">{plan.iyzicoPlanCode || '-'}</td>
                                <td className="px-6 py-4">
                                    {plan.isActive ? (
                                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-max">
                                            <Check className="w-3 h-3" /> Aktif
                                        </span>
                                    ) : (
                                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-max">
                                            <X className="w-3 h-3" /> Pasif
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(plan)}
                                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {plans.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    Henüz plan eklenmemiş.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#121212] border border-gray-800 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingPlan ? 'Planı Düzenle' : 'Yeni Plan Ekle'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Plan Adı</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                    placeholder="Örn: Premium Aylık"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Fiyat (₺)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Periyot</label>
                                    <select
                                        value={formData.interval}
                                        onChange={(e) => setFormData({...formData, interval: e.target.value})}
                                        className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                    >
                                        <option value="monthly">Aylık</option>
                                        <option value="yearly">Yıllık</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Iyzico Referans Kodu (Opsiyonel)</label>
                                <input
                                    type="text"
                                    value={formData.iyzicoPlanCode}
                                    onChange={(e) => setFormData({...formData, iyzicoPlanCode: e.target.value})}
                                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                    placeholder="Iyzico Plan Reference"
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer p-4 bg-black border border-gray-800 rounded-xl">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="w-5 h-5 rounded border-gray-800 text-orange-500 focus:ring-orange-500/20 bg-black"
                                />
                                <span className="text-gray-300 font-medium">Bu plan aktif olsun</span>
                            </label>

                            <div className="flex gap-3 pt-4 mt-6 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                                >
                                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
