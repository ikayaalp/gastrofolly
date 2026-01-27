"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Send, Clock, Trash2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface HistoryItem {
    id: string;
    date: string;
    preview: string;
    messages: Message[];
}

const SUGGESTIONS = [
    { id: 1, text: "🍝 İtalyan Makarnası Tarifi", icon: "🍝" },
    { id: 2, text: "🥩 Et Nasıl Mühürlenir?", icon: "🥩" },
    { id: 3, text: "🍰 Kolay Tatlı Önerisi", icon: "🍰" },
    { id: 4, text: "🥗 Sağlıklı Akşam Yemeği", icon: "🥗" },
];

export default function ChefAIClient() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [chatHistory, setChatHistory] = useState<HistoryItem[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Load history from local storage (simulated for web for now or use same key if possible via bridge, but web uses localStorage)
    useEffect(() => {
        const saved = localStorage.getItem('chef_ai_history_web');
        if (saved) {
            try {
                setChatHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveHistory = (msgs: Message[]) => {
        if (msgs.length === 0) return;

        // Create a new history item or update the latest one if it's the same session?
        // For simplicity, let's treat every "send" as updating the current session's history entry.
        // We need a session ID.
        const currentSessionId = sessionStorage.getItem('current_chat_session_id') || Date.now().toString();
        if (!sessionStorage.getItem('current_chat_session_id')) {
            sessionStorage.setItem('current_chat_session_id', currentSessionId);
        }

        const updatedHistory = [...chatHistory];
        const existingIndex = updatedHistory.findIndex(h => h.id === currentSessionId);

        const newItem: HistoryItem = {
            id: currentSessionId,
            date: new Date().toISOString(),
            preview: msgs[msgs.length - 1].content.substring(0, 50) + '...',
            messages: msgs
        };

        if (existingIndex >= 0) {
            updatedHistory[existingIndex] = newItem;
        } else {
            updatedHistory.unshift(newItem);
        }

        // Limit to 10 items
        const limitedHistory = updatedHistory.slice(0, 10);

        setChatHistory(limitedHistory);
        localStorage.setItem('chef_ai_history_web', JSON.stringify(limitedHistory));
    };

    // Save on unmount (approximate for web) or when chat "ends" (user clears/resets)
    // For web, we might just save when navigating away? Hard to hook exactly like RN focus/blur.
    // We'll save on every message for simplicity or have a "New Chat" button?
    // Let's save when the user explicitly clears or maybe just append to current session.
    // The RN app saves on "blur". We can try to use cleanup effect.
    // Auto-save history whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            saveHistory(messages);
        }
    }, [messages]);


    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: text.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // Mock API call or Real API call?
        // Using simple mock response for now to match UI first.
        // Ideally we call the same API endpoint.
        // Assuming /api/ai/chat exists or similar.
        // If not, I'll simulate a response.

        try {
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            setMessages([...newMessages, { role: 'assistant', content: data.reply || data.message || "Bir hata oluştu." }]);
        } catch (error) {
            // Fallback if API fails
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "Şu anda bağlantı kuramıyorum. Lütfen daha sonra tekrar dene. 👨‍🍳"
                }]);
            }, 1000);
        } finally {
            setIsLoading(false);
        }
    };

    const loadHistoryItem = (item: HistoryItem) => {
        setMessages(item.messages);
        sessionStorage.setItem('current_chat_session_id', item.id);
        setIsMenuVisible(false);
    };

    const clearHistory = () => {
        localStorage.removeItem('chef_ai_history_web');
        setChatHistory([]);
        setMessages([]); // Clear current screen too
        sessionStorage.removeItem('current_chat_session_id'); // Reset session
        setIsMenuVisible(false);
    };

    // New Chat handler
    const startNewChat = () => {
        setMessages([]);
        sessionStorage.removeItem('current_chat_session_id');
        setIsMenuVisible(false);
    };

    return (
        <div className="fixed inset-0 flex flex-col h-[100dvh] bg-black text-white z-40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#27272a] bg-black/80 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center">
                    {/* If coming from somewhere else, maybe back button? But usually this is a tab. */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center mr-3 shadow-lg shadow-orange-900/20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-6 h-6 text-white"
                        >
                            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                            <line x1="6" x2="18" y1="17" y2="17" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-wide">Culi</h1>
                        <p className="text-[13px] text-gray-400">Kişisel Mutfak Asistanın</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsMenuVisible(true)}
                    className="p-2 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] transition-colors"
                >
                    <Clock className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 pt-10">
                        <div className="w-20 h-20 rounded-full bg-[#27272a] border border-[#3f3f46] flex items-center justify-center mb-6">
                            <span className="text-4xl">👋</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Merhaba Şef!</h2>
                        <p className="text-gray-400 mb-8 max-w-xs leading-relaxed">
                            Bugün mutfakta sana nasıl yardımcı olabilirim?
                        </p>

                        <div className="w-full max-w-md">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Örnek Sorular</p>
                            <div className="grid grid-cols-1 gap-3">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => sendMessage(s.text)}
                                        className="flex items-center p-4 bg-[#18181b] border border-[#3f3f46] rounded-xl hover:bg-[#27272a] transition-all text-left group"
                                    >
                                        <span className="text-xl mr-3 group-hover:scale-110 transition-transform">{s.icon}</span>
                                        <span className="text-sm font-medium text-gray-200">{s.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                {msg.role !== 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 flex items-center justify-center mt-1">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-4 h-4 text-white"
                                        >
                                            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                                            <line x1="6" x2="18" y1="17" y2="17" />
                                        </svg>
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-orange-600 text-white rounded-br-sm'
                                        : 'bg-[#27272a] border border-[#3f3f46] text-gray-200 rounded-bl-sm'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                                    li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start mb-4 ml-11">
                                <div className="bg-[#27272a] border border-[#3f3f46] rounded-2xl p-4 rounded-bl-sm flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-xs text-gray-400 italic">Culi düşünüyor...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className={`bg-[#09090b] p-3 border-t border-[#27272a] shrink-0 transition-all duration-200 ${isFocused ? 'pb-2' : 'pb-24 md:pb-3'}`}>
                <div className="flex items-end bg-[#18181b] border border-[#3f3f46] rounded-[28px] p-1 px-4 relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Bir şeyler sor (örn: Lazanya tarifi)..."
                        className="flex-1 bg-transparent text-white text-[15px] max-h-24 py-3 focus:outline-none resize-none placeholder-gray-500"
                        rows={1}
                        onFocus={() => {
                            setIsFocused(true);
                            const nav = document.getElementById('mobile-bottom-nav');
                            if (nav) nav.style.display = 'none';
                        }}
                        onBlur={() => {
                            // Small delay to prevent flashing if just switching focus or clicking send
                            setTimeout(() => {
                                setIsFocused(false);
                                const nav = document.getElementById('mobile-bottom-nav');
                                if (nav) nav.style.display = 'block';
                            }, 100);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage(input);
                            }
                        }}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isLoading}
                        className={`mb-1 p-2 rounded-full flex-shrink-0 transition-all ${!input.trim() || isLoading
                            ? 'bg-[#27272a] text-gray-500'
                            : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/30'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* History Slide-over Menu (Mobile) or Modal */}
            {isMenuVisible && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
                    <div className="w-full h-full md:w-80 bg-[#18181b] flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
                            <h3 className="text-lg font-bold text-white">Sohbet Geçmişi</h3>
                            <div className="flex items-center">
                                <button
                                    onClick={startNewChat}
                                    className="mr-2 px-3 py-1.5 bg-orange-600 rounded-lg text-xs font-bold text-white hover:bg-orange-700 transition-colors"
                                >
                                    + Yeni
                                </button>
                                <button onClick={() => setIsMenuVisible(false)} className="p-2 hover:bg-[#27272a] rounded-full">
                                    <ChevronLeft className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {chatHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {chatHistory.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => loadHistoryItem(item)}
                                            className="w-full flex items-start p-3 rounded-xl bg-[#27272a] border border-[#3f3f46] active:scale-95 transition-transform text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center mr-3 border border-[#3f3f46] flex-shrink-0">
                                                <Clock className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] text-gray-500 font-medium">{new Date(item.date).toLocaleDateString('tr-TR')}</span>
                                                <p className="text-sm text-gray-200 truncate font-medium">{item.preview}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                    <Clock className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Henüz kaydedilmiş sohbet yok.</p>
                                </div>
                            )}
                        </div>

                        {chatHistory.length > 0 && (
                            <div className="p-4 border-t border-[#27272a]">
                                <button
                                    onClick={clearHistory}
                                    className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Geçmişi Temizle
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
