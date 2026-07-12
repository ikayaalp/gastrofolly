'use client'

import { useState, useEffect } from 'react'
import { X, Tag } from 'lucide-react'

interface ForumCategory {
    id: string
    name: string
    description: string | null
    color: string | null
    slug: string
    _count: { topics: number }
}

interface Props {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    editCategory?: ForumCategory | null
}

const COLOR_OPTIONS = [
    { label: 'Turuncu', value: '#f97316' },
    { label: 'Mavi', value: '#3b82f6' },
    { label: 'Yeşil', value: '#22c55e' },
    { label: 'Mor', value: '#a855f7' },
    { label: 'Kırmızı', value: '#ef4444' },
    { label: 'Sarı', value: '#eab308' },
    { label: 'Pembe', value: '#ec4899' },
    { label: 'Gri', value: '#6b7280' },
]

export default function ForumCategoryModal({ isOpen, onClose, onSuccess, editCategory }: Props) {
    const [name, setName] = useState(editCategory?.name || '')
    const [description, setDescription] = useState(editCategory?.description || '')
    const [color, setColor] = useState(editCategory?.color || COLOR_OPTIONS[0].value)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Modal mount'ta değil, editCategory/isOpen değiştiğinde senkronize et
    useEffect(() => {
        if (isOpen) {
            setName(editCategory?.name || '')
            setDescription(editCategory?.description || '')
            setColor(editCategory?.color || COLOR_OPTIONS[0].value)
            setError('')
        }
    }, [isOpen, editCategory])

    if (!isOpen) return null

    const isEditing = !!editCategory

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) { setError('Kategori adı zorunludur'); return }
        setLoading(true)
        setError('')

        try {
            const url = isEditing
                ? `/api/admin/forum/categories/${editCategory.id}`
                : '/api/admin/forum/categories'

            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || null, color }),
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Bir hata oluştu')
                return
            }

            onSuccess()
            onClose()
        } catch {
            setError('Sunucu hatası')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                            <Tag className="h-5 w-5 text-orange-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">
                            {isEditing ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Kategori Adı <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ör. Tarifler, Teknikler..."
                            className="w-full bg-black border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Açıklama
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Kategori hakkında kısa bir açıklama..."
                            className="w-full bg-black border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-600 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Renk
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setColor(opt.value)}
                                    title={opt.label}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === opt.value ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: opt.value }}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Seçili: <span style={{ color }}>{COLOR_OPTIONS.find(o => o.value === color)?.label}</span></p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
