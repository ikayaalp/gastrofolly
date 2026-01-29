'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    Users,
    MessageCircle,
    Trash2,
    Search,
    ExternalLink,
    AlertTriangle,
    Loader2,
    Filter,
    Plus
} from 'lucide-react'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import PollCreationModal from '@/components/admin/PollCreationModal'
import Link from 'next/link'

interface Author {
    id: string
    name: string | null
    image: string | null
}

interface Topic {
    id: string
    title: string
    content: string
    slug: string
    createdAt: string
    author: Author
    _count: {
        posts: number
    }
}

interface Post {
    id: string
    content: string
    createdAt: string
    topic: {
        id: string
        title: string
        slug: string
    }
    author: Author
}

export default function SocialAdminPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'topics' | 'posts'>('topics')
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<Topic[] | Post[]>([])
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Modal State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        id: string | null;
        type: 'topic' | 'post';
    }>({
        isOpen: false,
        id: null,
        type: 'topic'
    })
    const [actionLoading, setActionLoading] = useState(false)
    const [isPollModalOpen, setIsPollModalOpen] = useState(false)

    // Data Fetching
    const loadData = async () => {
        setLoading(true)
        try {
            // Admin için özel bir endpoint olmadığı için mevcut public endpointleri kullanıyoruz
            // Ancak gerçek bir admin panelinde "deleted" içerikleri de görebileceğimiz özel endpointler olmalı.
            // Şimdilik public listeyi çekip silme yetkisi kullanacağız.

            let url = ''
            if (activeTab === 'topics') {
                url = `/api/forum/topics?page=${page}&limit=20&sort=newest`
                if (search) url += `&search=${encodeURIComponent(search)}`
            } else {
                // Postları listeleyen genel bir endpoint şu an yok (sadece topic bazlı var).
                // Bu yüzden şimdilik sadece Topic moderasyonu yapabiliyoruz veya 
                // son yorumları çeken yeni bir API endpoint'i yazmamız gerekebilir.
                // Hızlı çözüm için: Şimdilik sadece TOPICS tab'ı aktif kalsın.
                setActiveTab('topics')
                url = `/api/forum/topics?page=${page}&limit=20&sort=newest`
            }

            const response = await fetch(url)
            const data = await response.json()

            if (activeTab === 'topics') {
                setItems(data.topics)
                setTotalPages(data.pagination.pages)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [activeTab, page, search]) // search için debounce eklenebilir

    const handleDeleteClick = (id: string, type: 'topic' | 'post') => {
        setDeleteModal({ isOpen: true, id, type })
    }

    const handleConfirmDelete = async () => {
        if (!deleteModal.id) return
        setActionLoading(true)

        try {
            let url = ''
            if (deleteModal.type === 'topic') {
                url = `/api/forum/topics/${deleteModal.id}/delete` // Delete route might need verify it accepts admin
            } else {
                url = `/api/forum/posts/${deleteModal.id}`
            }

            const response = await fetch(url, { method: 'DELETE' })

            if (response.ok) {
                // Refresh list
                loadData()
                setDeleteModal({ isOpen: false, id: null, type: 'topic' })
            } else {
                alert('Silme işlemi başarısız oldu')
            }
        } catch (error) {
            console.error('Delete error:', error)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent">
                    Chef Sosyal Yönetimi
                </h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsPollModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm text-white transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Anket Oluştur
                    </button>
                    <Link href="/chef-sosyal" target="_blank" className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Siteyi Görüntüle
                    </Link>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('topics')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'topics' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Başlıklar (Topics)
                    </button>
                    {/* Gelecekte eklenebilir: Yorumlar Sekmesi */}
                    {/* <button 
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'posts' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            Son Yorumlar
          </button> */}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-800 bg-black/40">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">İçerik</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Yazar</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tarih</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">İstatistik</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            Hiç içerik bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    (items as Topic[]).map((topic) => (
                                        <tr key={topic.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-white mb-1 line-clamp-1">{topic.title}</span>
                                                    <span className="text-xs text-gray-500 line-clamp-2">{topic.content}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {topic.author.image ? (
                                                        <img src={topic.author.image} alt="" className="w-6 h-6 rounded-full mr-2" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 flex items-center justify-center">
                                                            <Users className="w-3 h-3 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-gray-300">{topic.author.name || 'Anonim'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {format(new Date(topic.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                <div className="flex items-center space-x-3">
                                                    <span className="flex items-center text-xs bg-gray-800 px-2 py-1 rounded">
                                                        <MessageCircle className="w-3 h-3 mr-1 text-blue-400" />
                                                        {topic._count.posts}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <Link
                                                        href={`/chef-sosyal/topic/${topic.id}`}
                                                        target="_blank"
                                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(topic.id, 'topic')}
                                                        className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination (Simple) */}
            <div className="flex justify-center space-x-2 pt-4">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-white disabled:opacity-50 hover:bg-gray-700"
                >
                    Önceki
                </button>
                <span className="px-4 py-2 text-gray-400 text-sm">
                    Sayfa {page} / {totalPages || 1}
                </span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-white disabled:opacity-50 hover:bg-gray-700"
                >
                    Sonraki
                </button>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null, type: 'topic' })}
                onConfirm={handleConfirmDelete}
                title="İçeriği Sil"
                message="Bu içeriği kalıcı olarak silmek istediğinizden emin misiniz?"
                confirmText="Evet, Sil"
                cancelText="İptal"
                isDanger={true}
                isLoading={actionLoading}
            />

            <PollCreationModal
                isOpen={isPollModalOpen}
                onClose={() => setIsPollModalOpen(false)}
                onSuccess={() => {
                    loadData()
                    alert('Anket başarıyla oluşturuldu!')
                }}
            />
        </div>
    )
}
