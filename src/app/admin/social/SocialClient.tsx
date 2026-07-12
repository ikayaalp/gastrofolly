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
    Plus,
    Loader2,
    AlertTriangle,
    XCircle,
    Tag,
    Hash,
    Pencil,
} from 'lucide-react'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import PollCreationModal from '@/components/admin/PollCreationModal'
import ForumCategoryModal from '@/components/admin/ForumCategoryModal'
import Link from 'next/link'
import Image from 'next/image'

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
    _count: { posts: number }
}

interface Post {
    id: string
    content: string
    createdAt: string
    topic: { id: string; title: string; slug: string }
    author: Author
}

interface Report {
    id: string
    reason: string
    description: string | null
    status: string
    createdAt: string
    reporter: Author
    topic: { id: string; title: string } | null
    post: { id: string; content: string } | null
}

interface ForumCategory {
    id: string
    name: string
    description: string | null
    color: string | null
    slug: string
    _count: { topics: number }
}

interface Hashtag {
    id: string
    name: string
    _count: { topics: number }
}

type TabType = 'topics' | 'posts' | 'reports' | 'categories' | 'hashtags'

export default function SocialAdminPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabType>('topics')
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<Topic[] | Post[] | Report[]>([])
    const [categories, setCategories] = useState<ForumCategory[]>([])
    const [hashtags, setHashtags] = useState<Hashtag[]>([])
    const [search, setSearch] = useState('')
    const [hashtagSearch, setHashtagSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Modal State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean
        id: string | null
        type: 'topic' | 'post' | 'report' | 'category' | 'hashtag'
    }>({ isOpen: false, id: null, type: 'topic' })
    const [actionLoading, setActionLoading] = useState(false)
    const [isPollModalOpen, setIsPollModalOpen] = useState(false)
    const [categoryModal, setCategoryModal] = useState<{
        isOpen: boolean
        editCategory: ForumCategory | null
    }>({ isOpen: false, editCategory: null })

    // ── Data Fetching ──────────────────────────────────────
    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'categories') {
                const res = await fetch('/api/admin/forum/categories')
                const data = await res.json()
                setCategories(data.data || [])
            } else if (activeTab === 'hashtags') {
                const url = `/api/admin/forum/hashtags${hashtagSearch ? `?search=${encodeURIComponent(hashtagSearch)}` : ''}`
                const res = await fetch(url)
                const data = await res.json()
                setHashtags(data.data || [])
            } else {
                let url = ''
                if (activeTab === 'topics') {
                    url = `/api/admin/forum/topics?page=${page}&limit=20`
                    if (search) url += `&search=${encodeURIComponent(search)}`
                } else if (activeTab === 'posts') {
                    url = `/api/admin/forum/posts?page=${page}&limit=20`
                    if (search) url += `&search=${encodeURIComponent(search)}`
                } else {
                    url = `/api/admin/forum/reports?status=PENDING&page=${page}&limit=20`
                    if (search) url += `&search=${encodeURIComponent(search)}`
                }

                const response = await fetch(url)
                const data = await response.json()

                if (activeTab === 'topics') {
                    setItems(data.topics)
                    setTotalPages(data.pagination?.pages || 1)
                } else if (activeTab === 'posts') {
                    setItems(data.posts)
                    setTotalPages(data.pagination?.pages || 1)
                } else {
                    setItems(data.reports)
                    setTotalPages(data.pagination?.pages || 1)
                }
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [activeTab, page, search, hashtagSearch])

    // ── Handlers ───────────────────────────────────────────
    const handleDeleteClick = (id: string, type: 'topic' | 'post' | 'report' | 'category' | 'hashtag') => {
        setDeleteModal({ isOpen: true, id, type })
    }

    const handleDismissReport = async (id: string) => {
        if (!confirm('Bu şikayeti reddetmek istediğinizden emin misiniz? İçerik silinmeyecek.')) return
        setActionLoading(true)
        try {
            const response = await fetch(`/api/admin/forum/reports/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DISMISS' })
            })
            if (response.ok) loadData()
            else alert('İşlem başarısız oldu')
        } catch (error) {
            console.error('Dismiss report error:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!deleteModal.id) return
        setActionLoading(true)

        try {
            let url = ''
            let method = 'DELETE'
            let body: string | null = null

            if (deleteModal.type === 'topic') {
                url = `/api/forum/topics/${deleteModal.id}/delete`
            } else if (deleteModal.type === 'post') {
                url = `/api/forum/posts/${deleteModal.id}`
            } else if (deleteModal.type === 'report') {
                url = `/api/admin/forum/reports/${deleteModal.id}`
                method = 'PATCH'
                body = JSON.stringify({ action: 'REMOVE' })
            } else if (deleteModal.type === 'category') {
                url = `/api/admin/forum/categories/${deleteModal.id}`
            } else if (deleteModal.type === 'hashtag') {
                url = `/api/admin/forum/hashtags?id=${deleteModal.id}`
            }

            const res = await fetch(url, {
                method,
                ...(body && { headers: { 'Content-Type': 'application/json' }, body })
            })

            if (res.ok) {
                loadData()
                setDeleteModal({ isOpen: false, id: null, type: 'topic' })
            } else {
                const data = await res.json()
                alert(data.error || 'Silme işlemi başarısız oldu')
            }
        } catch (error) {
            console.error('Delete error:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const switchTab = (tab: TabType) => {
        setActiveTab(tab)
        setPage(1)
        setSearch('')
    }

    const isListTab = activeTab === 'topics' || activeTab === 'posts' || activeTab === 'reports'

    // ── Render ─────────────────────────────────────────────
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
                    <Link href="/culi" className="text-gray-300 hover:text-white transition-colors px-3 py-2">
                        Culi
                    </Link>
                    <Link href="/chef-sosyal" target="_blank" className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Siteyi Görüntüle
                    </Link>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => switchTab('topics')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'topics' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Başlıklar (Topics)
                    </button>
                    <button
                        onClick={() => switchTab('posts')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'posts' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Yorumlar (Posts)
                    </button>
                    <button
                        onClick={() => switchTab('reports')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Şikayetler (Reports)
                    </button>
                    <button
                        onClick={() => switchTab('categories')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <Tag className="h-4 w-4" />
                        Kategoriler
                    </button>
                    <button
                        onClick={() => switchTab('hashtags')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'hashtags' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <Hash className="h-4 w-4" />
                        Hashtagler
                    </button>
                </div>

                {isListTab && (
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
                )}
            </div>

            {/* ── CATEGORIES TAB ── */}
            {activeTab === 'categories' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setCategoryModal({ isOpen: true, editCategory: null })}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Yeni Kategori
                        </button>
                    </div>

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
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kategori</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Açıklama</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Başlık Sayısı</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {categories.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    Henüz kategori yok.
                                                </td>
                                            </tr>
                                        ) : (
                                            categories.map((cat) => (
                                                <tr key={cat.id} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: cat.color || '#6b7280' }}
                                                            />
                                                            <div>
                                                                <p className="text-sm font-semibold text-white">{cat.name}</p>
                                                                <p className="text-xs text-gray-500">/{cat.slug}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-400 max-w-xs">
                                                        {cat.description || <span className="text-gray-600 italic">—</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-300">
                                                        {cat._count.topics}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setCategoryModal({ isOpen: true, editCategory: cat })}
                                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                                                title="Düzenle"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(cat.id, 'category')}
                                                                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title="Sil"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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
                </div>
            )}

            {/* ── HASHTAGS TAB ── */}
            {activeTab === 'hashtags' && (
                <div className="space-y-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Hashtag ara..."
                            value={hashtagSearch}
                            onChange={(e) => setHashtagSearch(e.target.value)}
                            className="w-full bg-black border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

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
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hashtag</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Kullanım</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {hashtags.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                                    {hashtagSearch ? 'Arama sonucu bulunamadı.' : 'Henüz hashtag yok.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            hashtags.map((tag) => (
                                                <tr key={tag.id} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-purple-400">#{tag.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-300">
                                                        {tag._count.topics} başlık
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteClick(tag.id, 'hashtag')}
                                                            className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TOPICS / POSTS / REPORTS TABLE ── */}
            {isListTab && (
                <>
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
                                        ) : activeTab === 'reports' ? (
                                            (items as Report[]).map((report) => (
                                                <tr key={report.id} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col max-w-sm">
                                                            <div className="flex items-center mb-1">
                                                                <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
                                                                <span className="text-sm font-bold text-red-400">{report.reason}</span>
                                                            </div>
                                                            {report.description && <span className="text-xs text-gray-400 mb-2">{report.description}</span>}
                                                            <div className="bg-gray-900 p-2 rounded border border-gray-800">
                                                                <span className="text-xs text-gray-300 line-clamp-2">
                                                                    {report.topic ? `Başlık: ${report.topic.title}` : report.post ? `Yorum: ${report.post.content}` : 'Bilinmeyen İçerik'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {report.reporter?.image ? (
                                                                <Image width={24} height={24} src={report.reporter.image} alt="" className="rounded-full mr-2 object-cover" />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 flex items-center justify-center">
                                                                    <Users className="w-3 h-3 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <span className="text-sm text-gray-300">{report.reporter?.name || 'Anonim'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {format(new Date(report.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs">Bekliyor</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            {report.topic && (
                                                                <Link href={`/chef-sosyal/topic/${report.topic.id}`} target="_blank" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" title="İçeriğe Git">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </Link>
                                                            )}
                                                            <button onClick={() => handleDismissReport(report.id)} className="p-2 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Reddet (Kalsın)">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDeleteClick(report.id, 'report')} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Kaldır (Sil)">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : activeTab === 'topics' ? (
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
                                                                <Image width={24} height={24} src={topic.author.image} alt="" className="rounded-full mr-2 object-cover" />
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
                                                        <span className="flex items-center text-xs bg-gray-800 px-2 py-1 rounded w-fit">
                                                            <MessageCircle className="w-3 h-3 mr-1 text-blue-400" />
                                                            {topic._count.posts}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <Link href={`/chef-sosyal/topic/${topic.id}`} target="_blank" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={() => handleDeleteClick(topic.id, 'topic')} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            (items as Post[]).map((post) => (
                                                <tr key={post.id} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col max-w-sm">
                                                            <span className="text-sm text-gray-300 line-clamp-2">{post.content}</span>
                                                            <span className="text-xs text-gray-500 mt-1 line-clamp-1">↳ Konu: {post.topic.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {post.author.image ? (
                                                                <Image width={24} height={24} src={post.author.image} alt="" className="rounded-full mr-2 object-cover" />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 flex items-center justify-center">
                                                                    <Users className="w-3 h-3 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <span className="text-sm text-gray-300">{post.author.name || 'Anonim'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {format(new Date(post.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">-</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <Link href={`/chef-sosyal/topic/${post.topic.id}`} target="_blank" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={() => handleDeleteClick(post.id, 'post')} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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

                    {/* Pagination */}
                    <div className="flex justify-center space-x-2 pt-4">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-white disabled:opacity-50 hover:bg-gray-700">
                            Önceki
                        </button>
                        <span className="px-4 py-2 text-gray-400 text-sm">Sayfa {page} / {totalPages || 1}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-white disabled:opacity-50 hover:bg-gray-700">
                            Sonraki
                        </button>
                    </div>
                </>
            )}

            {/* ── MODALS ── */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null, type: 'topic' })}
                onConfirm={handleConfirmDelete}
                title={deleteModal.type === 'category' ? 'Kategoriyi Sil' : deleteModal.type === 'hashtag' ? 'Hashtag\'i Sil' : 'İçeriği Sil'}
                message={
                    deleteModal.type === 'category'
                        ? 'Bu kategoriyi kalıcı olarak silmek istediğinizden emin misiniz? İçinde başlık olan kategoriler silinemez.'
                        : deleteModal.type === 'hashtag'
                        ? 'Bu hashtag\'i kalıcı olarak silmek istediğinizden emin misiniz?'
                        : 'Bu içeriği kalıcı olarak silmek istediğinizden emin misiniz?'
                }
                confirmText="Evet, Sil"
                cancelText="İptal"
                isDanger={true}
                isLoading={actionLoading}
            />

            <PollCreationModal
                isOpen={isPollModalOpen}
                onClose={() => setIsPollModalOpen(false)}
                onSuccess={() => { loadData(); alert('Anket başarıyla oluşturuldu!') }}
            />

            <ForumCategoryModal
                isOpen={categoryModal.isOpen}
                onClose={() => setCategoryModal({ isOpen: false, editCategory: null })}
                onSuccess={() => { loadData(); setCategoryModal({ isOpen: false, editCategory: null }) }}
                editCategory={categoryModal.editCategory}
            />
        </div>
    )
}
