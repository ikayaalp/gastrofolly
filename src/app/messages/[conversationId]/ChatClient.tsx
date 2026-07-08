'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPusherClient } from '@/lib/pusherClient'

interface Message {
    id: string
    content: string
    senderId: string
    createdAt: string
    sender?: { id: string; name: string | null; image: string | null }
}

interface OtherUser {
    id: string
    name: string | null
    image: string | null
}

interface ChatClientProps {
    conversationId: string
    currentUserId: string
}

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatClient({ conversationId, currentUserId }: ChatClientProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [inputText, setInputText] = useState('')
    const [sending, setSending] = useState(false)
    const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [viewportStyle, setViewportStyle] = useState<{ height?: string, top?: string }>({})
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const isFetchingRef = useRef(false)

    // Handle mobile viewport height for keyboard
    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) return

        const updateViewport = () => {
            const vv = window.visualViewport
            if (vv) {
                setViewportStyle({
                    height: `${vv.height}px`,
                    top: `${vv.offsetTop}px`
                })
            }
        }

        updateViewport()
        window.visualViewport.addEventListener('resize', updateViewport)
        window.visualViewport.addEventListener('scroll', updateViewport)
        return () => {
            window.visualViewport?.removeEventListener('resize', updateViewport)
            window.visualViewport?.removeEventListener('scroll', updateViewport)
        }
    }, [])

    // Prevent body scroll when chat is open
    useEffect(() => {
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [])

    const markAsRead = useCallback(() => {
        fetch(`/api/dm/conversations/${conversationId}/read`, { method: 'PUT' }).catch(() => {})
    }, [conversationId])

    const fetchMessages = useCallback(async (isRefresh = false) => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true

        try {
            const res = await fetch(`/api/dm/conversations/${conversationId}/messages?page=1&limit=50`)
            if (!res.ok) {
                if (!isRefresh) {
                    const errData = await res.json().catch(() => ({}))
                    setError(errData.error || 'Sohbet yüklenemedi')
                    setLoading(false)
                }
                return
            }
            const data = await res.json()
            const fetchedMessages: Message[] = data.data || []
            
            setMessages((prev) => {
                const tempMessages = prev.filter(m => {
                    if (!m.id.startsWith('temp-')) return false
                    
                    // Eğer bu temp mesaj, sunucudan dönen gerçek mesajlar arasında zaten varsa 
                    // (içerik, gönderen eşleşiyorsa ve zaman olarak çok yakınsa), çiftlenmeyi önle.
                    // Zaman kontrolü (30 saniye), kullanıcının aynı mesajı ("Tamam" vb.) tekrarlaması durumunda eski mesajla eşleşip silinmesini engeller.
                    const isAlreadyFetched = fetchedMessages.some((fm) => {
                        const timeDiff = Math.abs(new Date(fm.createdAt).getTime() - new Date(m.createdAt).getTime())
                        return fm.senderId === m.senderId && fm.content === m.content && timeDiff < 30000
                    })
                    return !isAlreadyFetched
                })
                return [...fetchedMessages, ...tempMessages]
            })

            if (!isRefresh) {
                // Extract other user from messages
                const otherMsg = fetchedMessages.find(
                    (m: Message) => m.sender && m.sender.id !== currentUserId
                )
                if (otherMsg?.sender) {
                    setOtherUser({
                        id: otherMsg.sender.id,
                        name: otherMsg.sender.name,
                        image: otherMsg.sender.image,
                    })
                } else {
                    // Try fetching conversation list to find otherUser
                    try {
                        const convRes = await fetch('/api/dm/conversations')
                        if (convRes.ok) {
                            const convData = await convRes.json()
                            const conversations = convData.data || convData || []
                            const currentConv = conversations.find(
                                (c: { id: string }) => c.id === conversationId
                            )
                            if (currentConv) {
                                const other = currentConv.participants?.find(
                                    (p: { id: string }) => p.id !== currentUserId
                                ) || currentConv.otherUser
                                if (other) {
                                    setOtherUser({
                                        id: other.id,
                                        name: other.name || other.username || null,
                                        image: other.image || null,
                                    })
                                }
                            }
                        }
                    } catch {
                        // Silently ignore
                    }
                }
            }

            // Mark as read (fire and forget)
            markAsRead()
        } catch {
            if (!isRefresh) setError('Sohbet yüklenirken bir hata oluştu')
        } finally {
            if (!isRefresh) setLoading(false)
            isFetchingRef.current = false
        }
    }, [conversationId, currentUserId, markAsRead])

    // Fetch messages on mount
    useEffect(() => {
        fetchMessages(false)
    }, [fetchMessages])

    // Refresh on visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchMessages(true)
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [fetchMessages])

    // Pusher subscription
    useEffect(() => {
        const pusher = getPusherClient()
        if (!pusher) return

        const channel = pusher.subscribe(`private-conversation-${conversationId}`)

        channel.bind('new-message', (data: Message) => {
            if (data.senderId !== currentUserId) {
                setMessages((prev) => [...prev, data])
                markAsRead()
            }
        })

        return () => {
            channel.unbind_all()
            pusher.unsubscribe(`private-conversation-${conversationId}`)
        }
    }, [conversationId, currentUserId, markAsRead])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!inputText.trim()) return

        const content = inputText.trim()
        setInputText('')
        setSending(true)

        const tempId = 'temp-' + Date.now()
        const tempMessage: Message = {
            id: tempId,
            content,
            senderId: currentUserId,
            createdAt: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, tempMessage])

        try {
            const res = await fetch(`/api/dm/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            })

            if (res.ok) {
                const data = await res.json()
                const realMessage: Message = data.data
                setMessages((prev) =>
                    prev.map((m) => (m.id === tempId ? realMessage : m))
                )
            } else {
                // Remove temp message
                setMessages((prev) => prev.filter((m) => m.id !== tempId))

                const errorData = await res.json().catch(() => ({}))

                if (errorData.code === 'PREMIUM_REQUIRED') {
                    toast.error(
                        'Mesaj göndermek için premium üyelik gerekiyor. Premium üye olmak için Abone Ol sayfasını ziyaret edin.',
                        { duration: 5000 }
                    )
                } else {
                    toast.error(errorData.error || 'Mesaj gönderilemedi')
                }

                setInputText(content)
            }
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== tempId))
            toast.error('Mesaj gönderilemedi')
            setInputText(content)
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const getInitials = (name: string | null) => {
        if (!name) return '?'
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div 
            className="fixed inset-x-0 top-0 z-[100] flex flex-col bg-black h-[100dvh]"
            style={viewportStyle.height ? viewportStyle : undefined}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0a0a0a]">
                <Link
                    href="/messages"
                    className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>

                {otherUser ? (
                    <Link
                        href={`/chef-sosyal/profil/${otherUser.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        {otherUser.image ? (
                            <Image
                                src={otherUser.image}
                                alt={otherUser.name || 'Kullanıcı'}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#1f2937] flex items-center justify-center text-xs font-semibold text-gray-300">
                                {getInitials(otherUser.name)}
                            </div>
                        )}
                        <span className="text-white font-semibold text-sm">
                            {otherUser.name || 'Kullanıcı'}
                        </span>
                    </Link>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1f2937] animate-pulse" />
                        <div className="h-4 w-24 bg-[#1f2937] rounded animate-pulse" />
                    </div>
                )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <p className="text-gray-400 text-sm">{error}</p>
                        <Link
                            href="/messages"
                            className="text-orange-500 hover:text-orange-400 text-sm underline"
                        >
                            Mesajlara dön
                        </Link>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <MessageCircle className="h-12 w-12 text-gray-700" />
                        <p className="text-gray-500 text-sm">
                            Henüz mesaj yok. İlk mesajı gönderin!
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.senderId === currentUserId
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`px-4 py-2.5 max-w-[70%] ${
                                        isOwn
                                            ? 'bg-orange-600 text-white rounded-2xl rounded-br-sm'
                                            : 'bg-[#1f2937] text-gray-100 rounded-2xl rounded-bl-sm'
                                    }`}
                                >
                                    <p className="text-sm break-words">{msg.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${
                                            isOwn ? 'text-orange-200' : 'text-gray-500'
                                        }`}
                                    >
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-800 bg-[#0a0a0a]">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Bir mesaj yazın..."
                    className="flex-1 bg-[#111] text-white rounded-full px-5 py-3 text-base border border-gray-800 focus:border-orange-500 focus:outline-none placeholder-gray-500"
                    disabled={sending}
                />
                <button
                    onClick={handleSend}
                    disabled={!inputText.trim() || sending}
                    className="p-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
