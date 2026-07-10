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
                url = `/api/admin/forum/posts?page=${page}&limit=20`
                if (search) url += `&search=${encodeURIComponent(search)}`
            }

            const response = await fetch(url)
            const data = await response.json()

            if (activeTab === 'topics') {
                setItems(data.topics)
                setTotalPages(data.pagination?.pages || 1)
            } else {
                setItems(data.posts)
                setTotalPages(data.pagination?.pages || 1)
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
                    <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">
                      Culi
                    </Link>
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
