'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, ChefHat } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AIAssistantWidget() {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Visibility Logic
    if (status === 'loading' || status === 'unauthenticated' || !session?.user) return null

    const isHomePage = pathname === '/' || pathname === '/home'
    const isCourseDetailPage = (pathname?.startsWith('/courses/') || pathname?.startsWith('/course/')) && pathname.split('/').length > 2

    if (!isHomePage && !isCourseDetailPage) return null

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: 'user', content: input.trim() }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            })

            const data = await response.json()

            if (response.ok) {
                setMessages([...newMessages, { role: 'assistant', content: data.reply }])
            } else {
                setMessages([...newMessages, { role: 'assistant', content: data.error || 'Bir hata oluştu.' }])
            }
        } catch (error) {
            setMessages([...newMessages, { role: 'assistant', content: 'Bağlantı hatası. Lütfen tekrar deneyin.' }])
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

    const userName = session?.user?.name?.split(' ')[0] || 'Kullanıcı'

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div className="hidden md:flex fixed bottom-28 right-6 w-[400px] h-[600px] bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl flex-col z-[9999] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-[#111111] px-5 py-4 flex items-center justify-between border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                                <ChefHat className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base">Culi</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <p className="text-gray-400 text-xs">Çevrimiçi</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar bg-[#0a0a0a]">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                                    <ChefHat className="w-10 h-10 text-orange-500" />
                                </div>
                                <h4 className="text-white font-semibold text-lg mb-1">Merhaba {userName}! 👋</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    Ben Culi, gastronomi asistanınız. Yemek tarifleri, mutfak teknikleri ve kurslar hakkında bana her şeyi sorabilirsiniz.
                                </p>

                                {/* Quick suggestions */}
                                <div className="mt-6 space-y-2 w-full">
                                    {[
                                        "🍕 Ev yapımı pizza hamuru nasıl yapılır?",
                                        "🔪 Bıçak teknikleri nelerdir?",
                                        "🎓 Hangi kursu seçmeliyim?"
                                    ].map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setInput(suggestion)
                                            }}
                                            className="w-full text-left text-sm bg-gray-800/50 hover:bg-gray-800 text-gray-300 px-4 py-3 rounded-xl border border-gray-800 hover:border-gray-700 transition-all"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {/* Assistant avatar */}
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <ChefHat className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-orange-600 text-white rounded-2xl rounded-br-md'
                                        : 'bg-[#1a1a1a] text-gray-200 rounded-2xl rounded-bl-md border border-gray-800'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
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

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-gray-800 bg-[#111111]">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Mesajınızı yazın..."
                                className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-full transition-colors"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`hidden md:flex fixed bottom-8 right-6 w-16 h-16 rounded-full shadow-lg items-center justify-center z-[9999] transition-all duration-300 ${isOpen
                    ? 'bg-gray-800 hover:bg-gray-700 scale-90'
                    : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-orange-500/30'
                    }`}
            >
                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <ChefHat className="w-8 h-8 text-white" />
                )}
            </button>
        </>
    )
}
