'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface EditTopicModalProps {
    isOpen: boolean
    onClose: () => void
    topicId: string
    initialTitle: string
    initialContent: string
    initialCategoryId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('Bir hata oluştu')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gönderiyi Düzenle"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Kategori</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    >
                        <option value="">Seçiniz...</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Başlık"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="İlgi çekici bir başlık yazın..."
                />

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">İçerik</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                        placeholder="Neler düşünüyorsunuz? (Etiket eklemek için # kullanabilirsiniz)"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-zinc-800/50">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        isLoading={loading}
                    >
                        Kaydet
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
