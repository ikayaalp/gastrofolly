'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Plus, Send, Trash2, ChefHat, Loader2, Menu, X,
    Home, BookOpen, Users, MessageCircle, Search
} from 'lucide-react'
import UserDropdown from '@/components/ui/UserDropdown'
import NotificationDropdown from '@/components/ui/NotificationDropdown'

interface Message {
    id?: string
    role: 'user' | 'assistant'
    content: string
}

interface Conversation {
    id: string
    title: string
    updatedAt: string
}

export default function CuliPage() {
    const { data: session, status } = useSession()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [loadingConversations, setLoadingConversations] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/culi/conversations')
            const data = await res.json()
            setConversations(data.conversations || [])
        } catch (err) {
            console.error('Failed to load conversations:', err)
        } finally {
            setLoadingConversations(false)
        }
    }, [])

    useEffect(() => {
        if (session?.user) {
            loadConversations()
        }
    }, [session, loadConversations])

    // Load messages for a conversation
    const loadMessages = async (convId: string) => {
        try {
            const res = await fetch(`/api/culi/conversations/${convId}`)
            const data = await res.json()
            setMessages(data.conversation?.messages || [])
            setActiveConversationId(convId)
        } catch (err) {
            console.error('Failed to load messages:', err)
        }
    }

    // Create new conversation
    const createNewConversation = async () => {
        setActiveConversationId(null)
        setMessages([])
        inputRef.current?.focus()
    }

    // Delete conversation
    const deleteConversation = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await fetch(`/api/culi/conversations/${convId}`, { method: 'DELETE' })
            setConversations(prev => prev.filter(c => c.id !== convId))
            if (activeConversationId === convId) {
                setActiveConversationId(null)
                setMessages([])
            }
        } catch (err) {
            console.error('Failed to delete conversation:', err)
        }
    }

    // Send message
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            let convId = activeConversationId

            // Create conversation if none active
            if (!convId) {
                const createRes = await fetch('/api/culi/conversations', { method: 'POST' })
                const createData = await createRes.json()
                convId = createData.conversation.id
                setActiveConversationId(convId)

                // Max 10 conversations: delete oldest if exceeded
                const listRes = await fetch('/api/culi/conversations')
                const listData = await listRes.json()
                const allConvs = listData.conversations || []
                if (allConvs.length > 10) {
                    // Delete the oldest ones (they're sorted by updatedAt desc)
                    const toDelete = allConvs.slice(10)
                    for (const old of toDelete) {
                        await fetch(`/api/culi/conversations/${old.id}`, { method: 'DELETE' })
                    }
                }
            }

            const res = await fetch('/api/culi/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, conversationId: convId }),
            })

            const data = await res.json()

            if (res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Bir hata oluştu.' }])
            }

            // Refresh sidebar
            loadConversations()
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası. Lütfen tekrar deneyin.' }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // Format markdown-like content
    const formatContent = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/### (.*?)(\n|$)/g, '<h3 class="text-base font-semibold text-white mt-3 mb-1">$1</h3>')
            .replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/^\d+\. (.*?)$/gm, '<li class="ml-4 list-decimal">$1</li>')
            .replace(/\n\n/g, '<br/><br/>')
            .replace(/\n/g, '<br/>')
    }

    const userName = session?.user?.name?.split(' ')[0] || 'Kullanıcı'

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    if (!session?.user) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <ChefHat className="h-16 w-16 text-orange-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Culi AI</h1>
                <p className="text-gray-400 mb-6">Sohbet etmek için giriş yapmalısınız</p>
                <Link href="/auth/signin" className="bg-orange-600 px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                    Giriş Yap
                </Link>
            </div>
        )
    }

    return (
        <div className="h-screen bg-black flex flex-col">
            {/* Desktop Header */}
            <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-8">
                            <Link href="/home" className="flex items-center gap-0.5">
                                <div className="relative w-10 h-10">
                                    <Image src="/logo.jpeg" alt="C" fill className="object-contain" />
                                </div>
                                <span className="text-2xl font-bold tracking-tight">
                                    <span className="text-orange-500">ulin</span>
                                    <span className="text-white">ora</span>
                                </span>
                            </Link>
                            <nav className="flex space-x-6">
                                <Link href="/home" className="text-gray-300 hover:text-white transition-colors">Ana Sayfa</Link>
                                <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">Kurslarım</Link>
                                <Link href="/culi" className="text-orange-500 font-semibold">Culi</Link>
                                <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">Chef Sosyal</Link>
                                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">İletişim</Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <NotificationDropdown />
                            <UserDropdown />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Top Bar */}
            <div className="md:hidden bg-gray-900/30 backdrop-blur-sm border-b border-gray-800 z-50">
                <div className="flex justify-between items-center py-3 px-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-300">
                            <Menu className="h-5 w-5" />
                        </button>
                        <Link href="/home" className="flex items-center gap-0.5">
                            <div className="relative w-8 h-8">
                                <Image src="/logo.jpeg" alt="C" fill className="object-contain" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">
                                <span className="text-orange-500">ulin</span>
                                <span className="text-white">ora</span>
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-3">
                        <UserDropdown />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden md:pt-[73px]">
                {/* Sidebar */}
                <div className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#0a0a0a] border-r border-gray-800 flex flex-col overflow-hidden`}>
                    {/* New Chat Button */}
                    <div className="p-3">
                        <button
                            onClick={createNewConversation}
                            className="w-full flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors font-medium text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Yeni Sohbet
                        </button>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                        {loadingConversations ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <p className="text-gray-600 text-sm">Henüz sohbet yok</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => loadMessages(conv.id)}
                                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${activeConversationId === conv.id
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                        }`}
                                >
                                    <span className="truncate flex-1 mr-2">{conv.title}</span>
                                    <button
                                        onClick={(e) => deleteConversation(conv.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </button>
                            ))
                        )}
                    </div>

                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Toggle Sidebar Button (desktop) */}
                    <div className="hidden md:block absolute left-0 top-1/2 z-10">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-r-lg transition-all ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}
                        >
                            {isSidebarOpen ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            )}
                        </button>
                    </div>

                    {/* Messages | Welcome screen */}
                    {messages.length === 0 ? (
                        /* Gemini-style Welcome Screen — input centered on page */
                        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
                            <div className="relative w-20 h-20 mb-6">
                                <Image src="/logo.jpeg" alt="Culi" fill className="object-contain" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Merhaba {userName}! 👋</h1>
                            <p className="text-gray-500 text-base max-w-lg mb-8 text-center">
                                Ben <span className="text-orange-500 font-semibold">Culi</span>, gastronomi asistanınız.
                                Yemek tarifleri, mutfak teknikleri ve kurslar hakkında bana her şeyi sorabilirsiniz.
                            </p>
                            {/* Centered Input */}
                            <div className="w-full max-w-3xl">
                                <div className="flex items-end gap-3 bg-[#1a1a1a] border border-gray-700 focus-within:border-orange-500/50 rounded-2xl px-4 py-3 transition-colors">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Culi'ye bir şeyler sor..."
                                        rows={1}
                                        className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm max-h-32"
                                        style={{ minHeight: '24px' }}
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isLoading}
                                        className="p-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                                <p className="text-center text-xs text-gray-600 mt-2">
                                    Culi gastronomi konularında yardımcı olabilir. Yanılabilir.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Active Conversation — messages + bottom input */
                        <>
                            <div className="flex-1 overflow-y-auto">
                                <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'assistant' && (
                                                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <ChefHat className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                                    ? 'bg-orange-600 text-white rounded-2xl rounded-br-md'
                                                    : 'bg-[#1a1a1a] text-gray-200 rounded-2xl rounded-bl-md border border-gray-800'
                                                    }`}
                                            >
                                                {msg.role === 'assistant' ? (
                                                    <div
                                                        className="prose prose-invert prose-sm max-w-none [&_li]:text-gray-200 [&_strong]:text-white"
                                                        dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                                                    />
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                )}
                                            </div>
                                            {msg.role === 'user' && (
                                                session.user.image ? (
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1">
                                                        <Image src={session.user.image} alt={session.user.name || ''} fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 mt-1">
                                                        <span className="text-xs font-bold text-white">{session.user.name?.charAt(0) || '?'}</span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex gap-3 justify-start">
                                            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                                                <ChefHat className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-bl-md border border-gray-800">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Bottom Input — only when in conversation */}
                            <div className="border-t border-gray-800 bg-black px-4 py-4">
                                <div className="max-w-3xl mx-auto">
                                    <div className="flex items-end gap-3 bg-[#1a1a1a] border border-gray-700 focus-within:border-orange-500/50 rounded-2xl px-4 py-3 transition-colors">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Culi'ye bir şeyler sor..."
                                            rows={1}
                                            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm max-h-32"
                                            style={{ minHeight: '24px' }}
                                            disabled={isLoading}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!input.trim() || isLoading}
                                            className="p-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
                                        >
                                            <Send className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                    <p className="text-center text-xs text-gray-600 mt-2">
                                        Culi gastronomi konularında yardımcı olabilir. Yanılabilir.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden bg-black border-t border-gray-800 z-50">
                <div className="flex justify-around items-center py-2">
                    <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <Home className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Ana Sayfa</span>
                    </Link>
                    <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <BookOpen className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Kurslarım</span>
                    </Link>
                    <Link href="/culi" className="flex flex-col items-center py-2 px-3 text-orange-500">
                        <MessageCircle className="h-6 w-6" />
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
