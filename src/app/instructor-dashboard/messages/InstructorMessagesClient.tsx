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
  ChevronLeft
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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/instructor-dashboard" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mesajlar</h1>
                <p className="text-gray-400">Öğrencilerle iletişim kurun</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/chef-sor"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Chef&apos;e Sor</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
          {/* Konuşma Listesi */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
              {/* Search and Filter */}
              <div className="p-4 border-b border-gray-700">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Konuşmalarda ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className="w-full bg-gray-700 text-white pl-10 pr-8 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none appearance-none"
                    >
                      <option value="all">Tüm Kurslar</option>
                      {uniqueCourses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>Henüz konuşma yok</p>
                    <p className="text-sm">Öğrencilerden mesaj bekleniyor</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={`${conversation.user.id}-${conversation.course.id}`}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 cursor-pointer hover:bg-gray-700 transition-colors ${
                          selectedConversation?.user.id === conversation.user.id && 
                          selectedConversation?.course.id === conversation.course.id 
                            ? 'bg-gray-700' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center relative">
                            {conversation.user.image ? (
                              <Image
                                src={conversation.user.image}
                                alt={conversation.user.name || 'User'}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="h-5 w-5 text-white" />
                            )}
                            {conversation.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="text-white font-medium truncate">
                                {conversation.user.name}
                              </h3>
                              <span className="text-gray-400 text-xs">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                              {conversation.lastMessage.content}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs">
                                {conversation.course.title}
                              </span>
                              <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs">
                                {conversation.messages.length} mesaj
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sohbet Alanı */}
          <div className="lg:col-span-3">
            {selectedConversation ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
                {/* Sohbet Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
                      {selectedConversation.user.image ? (
                        <Image
                          src={selectedConversation.user.image}
                          alt={selectedConversation.user.name || 'User'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {selectedConversation.user.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {selectedConversation.course.title}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mesajlar */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                      <p>Henüz mesaj yok</p>
                    </div>
                  ) : (
                    selectedMessages.map((message) => (
                      <div key={message.id} className="space-y-4">
                        {/* Öğrenci Mesajı */}
                        <div className="flex justify-start">
                          <div className="max-w-xs lg:max-w-md">
                            <div className="bg-gray-700 rounded-lg p-3">
                              <p className="text-gray-300 text-sm">{message.content}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Eğitmen Yanıtları */}
                        {message.replies.map((reply) => (
                          <div key={reply.id} className="flex justify-end">
                            <div className="max-w-xs lg:max-w-md">
                              <div className="bg-orange-600 rounded-lg p-3">
                                <p className="text-white text-sm">{reply.content}</p>
                                <p className="text-orange-200 text-xs mt-1">
                                  {formatTime(reply.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                {/* Yanıt Formu */}
                <div className="p-4 border-t border-gray-700">
                  <div className="space-y-3">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Yanıtınızı yazın..."
                      className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => selectedConversation && handleReply(selectedConversation.lastMessage.id)}
                      disabled={!replyContent.trim()}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Reply className="h-4 w-4" />
                      <span>Yanıtla</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Konuşma Seçin</h3>
                  <p>Mesajlaşmak istediğiniz öğrenciyi seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}