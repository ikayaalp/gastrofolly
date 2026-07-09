"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { Plus, Edit2, Trash2, Loader2, Tags, Layers } from "lucide-react"

type Category = {
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    _count: {
        courses: number
    }
}

export default function CategoryManagement({ categories: initialCategories }: { categories: Category[] }) {
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({
        name: ""
    })

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category)
            setFormData({
                name: category.name
            })
        } else {
            setEditingCategory(null)
            setFormData({
                name: ""
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (editingCategory) {
                const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Güncellenemedi")
                }
                
                const data = await res.json()
                setCategories(categories.map(c => c.id === editingCategory.id ? { ...data.category, _count: c._count } : c))
                toast.success("Kategori güncellendi")
            } else {
                const res = await fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Eklenemedi")
                }
                
                const data = await res.json()
                setCategories([...categories, { ...data.category, _count: { courses: 0 } }])
                toast.success("Kategori eklendi")
            }
            setIsModalOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string, coursesCount: number) => {
        if (coursesCount > 0) {
            toast.error(`Bu kategoriye bağlı ${coursesCount} kurs var, önce onları başka bir kategoriye taşıyın.`)
            return
        }

        if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return

        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: 'DELETE'
            })
            
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Silinemedi")
            }
            
            setCategories(categories.filter(c => c.id !== id))
            toast.success("Kategori silindi")
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Kategori Yönetimi</h1>
                    <p className="text-gray-400 mt-1">Sistemdeki tüm kurs kategorilerini yönetin.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Kategori Ekle
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-orange-500/20 p-3 rounded-xl">
                            <Tags className="h-6 w-6 text-orange-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Toplam Kategori</p>
                    <p className="text-3xl font-bold text-white mt-1">{categories.length}</p>
                </div>
                
                <div className="bg-black border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl">
                            <Layers className="h-6 w-6 text-blue-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Kurs Atanmış Kategori</p>
                    <p className="text-3xl font-bold text-white mt-1">{categories.filter(c => c._count.courses > 0).length}</p>
                </div>
            </div>

            <div className="bg-black rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-neutral-900 border-b border-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400">Kategori Adı</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400">Slug</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400">Kurs Sayısı</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-400 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(category => (
                            <tr key={category.id} className="border-b border-gray-800 hover:bg-white/5">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{category.name}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-300 font-mono text-sm">{category.slug}</td>
                                <td className="px-6 py-4 text-gray-300">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${category._count.courses > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                                        {category._count.courses} Kurs
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="text-blue-500 hover:text-blue-400 p-2"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id, category._count.courses)}
                                        className="text-red-500 hover:text-red-400 p-2"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    Henüz kategori bulunmuyor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Kategori Adı</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-neutral-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                    placeholder="Örn: Tatlılar"
                                />
                            </div>

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
