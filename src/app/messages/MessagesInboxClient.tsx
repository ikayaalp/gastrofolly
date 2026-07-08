'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react'
import { getPusherClient } from '@/lib/pusherClient'

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
        <div className="min-h-screen bg-black">
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
            <div className="max-w-2xl mx-auto px-4 py-4">
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
                            <div
                                key={item.id}
                                onClick={() => router.push(`/messages/${item.id}`)}
                                className="cursor-pointer hover:bg-[#111] transition-colors rounded-xl p-4 flex items-center gap-3"
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
                                <div className="flex-1 min-w-0">
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
                                    <div className="flex-shrink-0">
                                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
