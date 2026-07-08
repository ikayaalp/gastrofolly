'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EditTopicModalProps {
    isOpen: boolean
    onClose: () => void
    topicId: string
    initialTitle: string
    initialContent: string
    initialCategoryId: string
    onTopicUpdated?: (updatedData: any) => void
}

export default function EditTopicModal({ isOpen, onClose, topicId, initialTitle, initialContent, initialCategoryId, onTopicUpdated }: EditTopicModalProps) {
    const [title, setTitle] = useState(initialTitle)
    const [content, setContent] = useState(initialContent)
    const [categoryId, setCategoryId] = useState(initialCategoryId)
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            fetchCategories()
            setTitle(initialTitle)
            setContent(initialContent)
            setCategoryId(initialCategoryId)
            setError('')
        }
    }, [isOpen, initialTitle, initialContent, initialCategoryId])

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/forum/categories')
            if (res.ok) {
                const data = await res.json()
                setCategories(data)
            }
        } catch (e) {
            console.error('Error fetching categories:', e)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim() || !content.trim() || !categoryId) {
            setError('Başlık, içerik ve kategori zorunludur.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/forum/topics/${topicId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, categoryId })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Bir hata oluştu')
            }

            if (onTopicUpdated) {
                onTopicUpdated(data.topic)
            } else {
                router.refresh()
            }
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-[#111] rounded-2xl w-full max-w-2xl border border-gray-800 shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Gönderiyi Düzenle</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Kategori</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                        >
                            <option value="">Seçiniz...</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Başlık</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                            placeholder="İlgi çekici bir başlık yazın..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">İçerik</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 resize-none"
                            placeholder="Neler düşünüyorsunuz? (Etiket eklemek için # kullanabilirsiniz)"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg text-gray-400 hover:text-white mr-3"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
