'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, ChefHat } from 'lucide-react'
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
    if (status !== 'authenticated') return null

    // Sadece Home (/, /home) ve Kurs Detay (/courses/[slug]) sayfalarında göster
    // /learn sayfalarında veya diğerlerinde gösterme
    const isHomePage = pathname === '/' || pathname === '/home'
    // Kurs detay sayfası kontrolü: /courses/ veya /course/ ile başlıyorsa ve devamı varsa
    const isCourseDetailPage = (pathname?.startsWith('/courses/') || pathname?.startsWith('/course/')) && pathname.split('/').length > 2

    // Eğer izin verilen sayfalarda değilse null döndür
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

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-36 md:bottom-28 right-6 w-[350px] md:w-[400px] h-[450px] md:h-[550px] bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl flex flex-col z-[9999] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <ChefHat className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Chef AI</h3>
                                <p className="text-white/80 text-xs">Gastronomi Asistanınız</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <ChefHat className="w-16 h-16 text-orange-500 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">Merhaba! 👋</p>
                                <p className="text-gray-500 text-xs mt-1">Gastronomi hakkında soru sorabilirsiniz.</p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-orange-600 text-white rounded-br-sm'
                                        : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-800 bg-[#0a0a0a]">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Mesajınızı yazın..."
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full transition-colors"
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
                className={`fixed bottom-24 md:bottom-8 right-6 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg flex items-center justify-center z-[9999] transition-all duration-300 ${isOpen
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 animate-bounce'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 md:w-8 md:h-8 text-white" />
                ) : (
                    <ChefHat className="w-7 h-7 md:w-9 md:h-9 text-white" />
                )}
            </button>
        </>
    )
}
