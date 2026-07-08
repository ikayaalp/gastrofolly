'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageCircle, Home, BookOpen, Users, ChefHat, Trash2 } from 'lucide-react'
import { getPusherClient } from '@/lib/pusherClient'
import toast from 'react-hot-toast'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

interface Conversation {
    id: string
    lastMessageAt: string
    createdAt: string
    otherUser: { id: string; name: string | null; image: string | null } | null
    lastMessage: { content: string; createdAt: string } | null
    unreadCount: number
}

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Az önce'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`

    return date.toLocaleDateString('tr-TR')
}

function getInitials(name: string | null): string {
    if (!name) return '?'
    return name
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function ConversationRow({
    item,
    router,
    onDelete
}: {
    item: Conversation
    router: any
    onDelete: (id: string) => void
}) {
    const [translateX, setTranslateX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const startXRef = useRef<number | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const handleTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX
        setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startXRef.current === null) return
        const currentX = e.touches[0].clientX
        const diff = currentX - startXRef.current
        
        if (diff < 0) {
            setTranslateX(Math.max(diff, -80))
        } else {
            setTranslateX(0)
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        if (translateX < -50) {
            setTranslateX(-80)
        } else {
            setTranslateX(0)
        }
        startXRef.current = null
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowDeleteModal(true)
    }

    const handleConfirmDelete = () => {
        setShowDeleteModal(false)
        onDelete(item.id)
    }

    const handleCancelDelete = () => {
        setShowDeleteModal(false)
        setTranslateX(0)
    }

    const handleClick = () => {
        if (translateX < -10) {
            setTranslateX(0)
        } else {
            router.push(`/messages/${item.id}`)
        }
    }

    return (
        <div className="relative overflow-hidden rounded-xl group mb-1 bg-black">
            {/* Background delete button */}
            <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center rounded-xl">
                <button
                    onClick={handleDeleteClick}
                    className="w-full h-full flex items-center justify-center text-white outline-none"
                >
                    <Trash2 className="h-6 w-6" />
                </button>
            </div>
            
            {/* Main row content */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleClick}
                style={{
                    transform: `translateX(${translateX}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
                className="relative z-10 bg-[#000] cursor-pointer hover:bg-[#111] transition-colors p-4 flex items-center gap-3 rounded-xl border border-transparent group-hover:border-gray-800"
            >
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {item.otherUser?.image ? (
                        <img
                            src={item.otherUser.image}
                            alt={item.otherUser.name || 'User'}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {getInitials(item.otherUser?.name || null)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center justify-between">
                        <p
                            className={`text-sm truncate ${
                                item.unreadCount > 0
                                    ? 'text-white font-bold'
                                    : 'text-white font-semibold'
                            }`}
                        >
                            {item.otherUser?.name || 'Bilinmeyen Kullanıcı'}
                        </p>
                        <span className="text-gray-500 text-xs flex-shrink-0 ml-2">
                            {formatTimeAgo(item.lastMessage?.createdAt || item.lastMessageAt)}
                        </span>
                    </div>
                    {item.lastMessage && (
                        <p className="text-gray-400 text-sm line-clamp-1 mt-0.5">
                            {item.lastMessage.content}
                        </p>
                    )}
                </div>

                {/* Unread indicator */}
                {item.unreadCount > 0 && (
                    <div className="flex-shrink-0 absolute right-4 md:group-hover:hidden">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block" />
                    </div>
                )}
                
                {/* Desktop hover delete icon */}
                <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 items-center pl-2">
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Konuşmayı Sil"
                message="Bu konuşmayı silmek istediğinize emin misiniz? Karşı taraf bu konuşmayı görmeye devam edecek."
                confirmText="Sil"
                cancelText="Vazgeç"
                isDanger={true}
            />
        </div>
    )
}

export default function MessagesInboxClient({ userId }: { userId: string }) {
    const router = useRouter()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchConversations = async () => {
        try {
            const response = await fetch('/api/dm/conversations')
            if (response.ok) {
                const data = await response.json()
                setConversations(data.data || [])
            } else {
                setError('Mesajlar yüklenemedi')
            }
        } catch (err) {
            console.error('Error fetching conversations:', err)
            setError('Bir bağlantı hatası oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteConversation = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/dm/conversations/${conversationId}`, {
                method: 'DELETE'
            })
            const data = await response.json()
            if (data.success) {
                setConversations(prev => prev.filter(c => c.id !== conversationId))
            } else {
                toast.error(data.error || 'Silinirken bir hata oluştu')
            }
        } catch (err) {
            toast.error('Bağlantı hatası')
        }
    }

    useEffect(() => {
        fetchConversations()

        // Subscribe to Pusher for real-time updates
        const pusher = getPusherClient()
        if (!pusher) return

        const channel = pusher.subscribe(`private-user-${userId}`)

        channel.bind('inbox-update', () => {
            fetchConversations()
        })

        return () => {
            channel.unbind_all()
            pusher.unsubscribe(`private-user-${userId}`)
        }
    }, [userId])

    return (
        <div className="fixed inset-0 z-[100] bg-black overflow-y-auto">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-2xl mx-auto flex items-center px-4 py-3">
                    <Link
                        href="/home"
                        className="p-2 text-gray-300 hover:text-white transition-colors mr-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-white text-lg font-bold">Mesajlar</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-4 pb-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-400 text-sm mb-2">{error}</p>
                        <button
                            onClick={() => {
                                setError(null)
                                setLoading(true)
                                fetchConversations()
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <MessageCircle className="h-16 w-16 text-gray-600 mb-4" />
                        <p className="text-gray-400 text-sm">Henüz mesajınız yok</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {conversations.map((item) => (
                            <ConversationRow 
                                key={item.id} 
                                item={item} 
                                router={router} 
                                onDelete={handleDeleteConversation} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
                <div className="flex justify-around items-center py-2">
                    <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <Home className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Ana Sayfa</span>
                    </Link>
                    <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <BookOpen className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Kurslarım</span>
                    </Link>
                    <Link href="/culi" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <ChefHat className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Culi</span>
                    </Link>
                    <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <Users className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Sosyal</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
