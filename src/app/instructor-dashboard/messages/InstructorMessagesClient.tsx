"use client"

import { useState, useMemo } from "react"
import { 
  MessageSquare, 
  Reply, 
  Send, 
  User, 
  Calendar,
  BookOpen,
  Search,
  Filter,
  MoreVertical,
  Users,
  Clock,
  ChevronLeft,
  MessageCircle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ChefHat } from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
}

interface Course {
  id: string
  title: string
  imageUrl: string | null
}

interface Reply {
  id: string
  content: string
  createdAt: Date
  user: User
}

interface Message {
  id: string
  content: string
  createdAt: Date
  user: User
  course: Course
  replies: Reply[]
}

interface Conversation {
  user: User
  course: Course
  messages: Message[]
  lastMessage: Message
  unreadCount: number
}

interface Session {
  user: {
    id: string
    name?: string | null | undefined
    email?: string | null | undefined
    image?: string | null | undefined
    role?: string | undefined
  }
}

interface Props {
  messages: Message[]
  session: Session
}

export default function InstructorMessagesClient({ messages, session }: Props) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("all")
  const [activeTab, setActiveTab] = useState<'history' | 'new'>('history')

  // Mesajları kişi bazında grupla
  const conversations = useMemo(() => {
    const conversationMap = new Map<string, Conversation>()
    
    messages.forEach(message => {
      const key = `${message.user.id}-${message.course.id}`
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          user: message.user,
          course: message.course,
          messages: [],
          lastMessage: message,
          unreadCount: 0
        })
      }
      
      const conversation = conversationMap.get(key)!
      conversation.messages.push(message)
      
      // Son mesajı güncelle
      if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
        conversation.lastMessage = message
      }
      
      // Okunmamış mesaj sayısını hesapla (eğitmenin yanıtlamadığı mesajlar)
      const hasInstructorReply = message.replies.some(reply => reply.user.id === session.user.id)
      if (!hasInstructorReply) {
        conversation.unreadCount++
      }
    })
    
    return Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())
  }, [messages, session.user.id])

  // Filtrelenmiş konuşmalar
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const matchesSearch = conversation.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conversation.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conversation.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCourse = filterCourse === "all" || conversation.course.id === filterCourse
      
      return matchesSearch && matchesCourse
    })
  }, [conversations, searchTerm, filterCourse])

  // Seçili konuşmanın mesajları (tarihe göre sıralı)
  const selectedMessages = useMemo(() => {
    if (!selectedConversation) return []
    
    return selectedConversation.messages
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [selectedConversation])

  const uniqueCourses = useMemo(() => {
    return conversations.reduce((acc, conversation) => {
      if (!acc.find(course => course.id === conversation.course.id)) {
        acc.push(conversation.course)
      }
      return acc
    }, [] as Course[])
  }, [conversations])

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Şimdi'
    if (minutes < 60) return `${minutes}dk`
    if (hours < 24) return `${hours}sa`
    if (days < 7) return `${days}g`
    return new Date(date).toLocaleDateString('tr-TR')
  }

  const handleReply = async (messageId: string) => {
    if (!replyContent.trim()) return

    try {
      const response = await fetch('/api/instructor/messages/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          content: replyContent
        }),
      })

      if (response.ok) {
        setReplyContent("")
        // Refresh messages or update state
        window.location.reload()
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/instructor-dashboard" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
                <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Eğitmen</span>
              </Link>
              <nav className="flex space-x-6">
                <Link href="/instructor-dashboard" className="text-white font-semibold">
                  Dashboard
                </Link>
                <Link href="/instructor-dashboard/courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurslarım
                </Link>
                <Link href="/instructor-dashboard/messages" className="text-gray-300 hover:text-white transition-colors">
                  Mesajlar
                </Link>
                <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                  Chef Sosyal
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/instructor-dashboard" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
          </Link>
        </div>
      </div>

      <div className="pt-16 md:pt-24 pb-20 md:pb-8 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sol Panel - Tab Navigation */}
            <div className="bg-gray-800 rounded-lg p-6 flex flex-col h-[400px] md:h-[600px]">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Sohbet Geçmişi
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'history' && (
                <>
                  <h2 className="text-lg font-semibold text-white mb-4">Öğrenci Mesajları</h2>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Öğrenci ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {filteredConversations.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        Henüz mesaj yok
                      </p>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={`${conversation.user.id}-${conversation.course.id}`}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-4 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation?.user.id === conversation.user.id && 
                            selectedConversation?.course.id === conversation.course.id
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center relative">
                              {conversation.user.image ? (
                                <Image
                                  src={conversation.user.image}
                                  alt={conversation.user.name || 'Öğrenci'}
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                />
                              ) : (
                                <span className="text-white font-semibold">
                                  {conversation.user.name?.charAt(0).toUpperCase() || 'Ö'}
                                </span>
                              )}
                              {conversation.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {conversation.user.name || 'Öğrenci'}
                              </p>
                              <p className="text-sm opacity-75 truncate">
                                {conversation.lastMessage.content}
                              </p>
                              <p className="text-xs opacity-50 mt-1">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </p>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs">
                                  {conversation.course.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sağ Panel - Mesajlaşma */}
            <div className="bg-gray-800 rounded-lg p-6 flex flex-col h-[400px] md:h-[600px]">
              {/* Mesaj Header */}
              <div className="mb-4 pb-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Mesajlaşma</h2>
                {selectedConversation && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center">
                        {selectedConversation.user.image ? (
                          <Image
                            src={selectedConversation.user.image}
                            alt={selectedConversation.user.name || 'Öğrenci'}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="text-white text-xs font-semibold">
                            {selectedConversation.user.name?.charAt(0).toUpperCase() || 'Ö'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-300">
                        {selectedConversation.user.name || 'Öğrenci'}
                      </span>
                      <span className="text-xs text-gray-400">
                        - {selectedConversation.course.title}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-400 text-center">
                    Mesajlaşmak için bir öğrenci seçin
                  </p>
                </div>
              ) : (
                <>
                  {/* Mesaj Listesi */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-800 pr-2 pl-1">
                    {selectedMessages.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        Henüz mesaj yok
                      </p>
                    ) : (
                      selectedMessages.map((message) => (
                        <div key={message.id} className="space-y-3 mb-4">
                          {/* Öğrenci Mesajı */}
                          <div className="flex justify-start">
                            <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-gray-700 text-gray-300">
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-75 mt-1">
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Eğitmen Yanıtları */}
                          {message.replies.map((reply) => (
                            <div key={reply.id} className="flex justify-end">
                              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-orange-600 text-white">
                                <p className="text-sm">{reply.content}</p>
                                <p className="text-xs opacity-75 mt-1">
                                  {formatTime(reply.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Yanıt Formu */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && selectedConversation && handleReply(selectedConversation.lastMessage.id)}
                      placeholder="Yanıtınızı yazın..."
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={() => selectedConversation && handleReply(selectedConversation.lastMessage.id)}
                      disabled={!replyContent.trim()}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/instructor-dashboard" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <ChefHat className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Dashboard</span>
          </Link>
          <Link href="/instructor-dashboard/courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/instructor-dashboard/messages" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef Sosyal</span>
          </Link>
        </div>
      </div>
    </div>
  )
}