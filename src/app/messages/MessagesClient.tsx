"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  MessageSquare,
  Send,
  User,
  Search,
  ChevronLeft,
  Clock,
  ChefHat,
  BookOpen,
  Plus,
  X,
  Home,
  Users,
  MessageCircle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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
  instructor?: User
  lessonCount?: number
}

interface Message {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  user: User
  course: Course
  replies: Reply[]
}

interface Reply {
  id: string
  content: string
  createdAt: Date
  user: User
}

interface Conversation {
  otherUser: User
  course: Course
  lastMessage: Message
  lastMessageTime: Date
  unreadCount: number
}

interface Instructor {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  courses: Course[]
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
  session: Session
}

export default function MessagesClient({ session }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const instructorIdFromUrl = searchParams.get('instructorId')
  const courseIdFromUrl = searchParams.get('courseId')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Konuşmaları yükle
  useEffect(() => {
    fetchConversations()
    fetchInstructors()

    // Her 30 saniyede bir konuşmaları güncelle (yeni mesajlar için)
    const interval = setInterval(() => {
      fetchConversations()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // URL'den gelen parametrelerle konuşma aç
  useEffect(() => {
    if (instructorIdFromUrl && instructors.length > 0) {
      // Önce mevcut konuşmalarda ara
      const existingConversation = conversations.find(conv =>
        conv.otherUser.id === instructorIdFromUrl &&
        (!courseIdFromUrl || conv.course.id === courseIdFromUrl)
      )

      if (existingConversation) {
        setSelectedConversation(existingConversation)
      } else {
        // Konuşma yoksa, instructor'ı bul ve yeni konuşma başlat
        const instructor = instructors.find(inst => inst.id === instructorIdFromUrl)
        if (instructor) {
          // Eğer courseId belirtilmişse o kursu kullan, yoksa ilk kursu kullan
          const course = courseIdFromUrl
            ? instructor.courses.find(c => c.id === courseIdFromUrl)
            : instructor.courses[0]

          if (course) {
            startNewConversation(instructor, course)
          }
        }
      }
    }
  }, [instructorIdFromUrl, courseIdFromUrl, conversations, instructors])

  // Mesajları yükle
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.otherUser.id, selectedConversation.course.id)
      // Mesajlar açıldığında okunmamış sayısını güncelle
      const updatedConversations = conversations.map(conv =>
        conv.otherUser.id === selectedConversation.otherUser.id &&
          conv.course.id === selectedConversation.course.id
          ? { ...conv, unreadCount: 0 }
          : conv
      )
      setConversations(updatedConversations)

      // Toplam unread count'u güncelle
      const totalUnread = updatedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
      setUnreadCount(totalUnread)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)

        // Toplam okunmamış mesaj sayısını hesapla
        const totalUnread = data.conversations.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0)
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (instructorId: string, courseId?: string) => {
    try {
      const url = courseId
        ? `/api/messages/thread?instructorId=${instructorId}&courseId=${courseId}`
        : `/api/messages/thread?instructorId=${instructorId}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/messages/instructors')
      if (response.ok) {
        const data = await response.json()
        setInstructors(data.instructors)
      }
    } catch (error) {
      console.error('Error fetching instructors:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || (!selectedConversation && !selectedCourse)) return

    setSending(true)
    try {
      const courseId = selectedCourse?.id || selectedConversation?.course.id
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          courseId: courseId,
          parentId: replyingTo?.id || null
        }),
      })

      if (response.ok) {
        setNewMessage("")
        setReplyingTo(null)
        if (selectedConversation) {
          fetchMessages(selectedConversation.otherUser.id, selectedConversation.course.id)
        }
        fetchConversations() // Bu unread count'u da güncelleyecek
        setShowNewMessageModal(false)
        setSelectedCourse(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Mesaj gönderilemedi')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Mesaj gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const startNewConversation = (instructor: Instructor, course: Course) => {
    setSelectedConversation({
      otherUser: instructor,
      course: course,
      lastMessage: {
        id: '',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: session.user as User,
        course: course,
        replies: []
      },
      lastMessageTime: new Date(),
      unreadCount: 0
    })
    setMessages([])
    setShowNewMessageModal(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Şimdi'
    if (minutes < 60) return `${minutes}dk önce`
    if (hours < 24) return `${hours}sa önce`
    if (days < 7) return `${days} gün önce`
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  //ismail kayaalp nasılsın
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/home" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <MessageSquare className="h-6 w-6 text-orange-500" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
                <h1 className="text-xl font-bold text-white">Mesajlar</h1>
              </div>
            </div>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all flex items-center space-x-2 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Sohbet</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* Mobile Chat Overlay */}
        {showMobileChat && selectedConversation && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black" style={{ height: '100dvh' }}>
            <div className="h-full flex flex-col">
              {/* Mobile Chat Header */}
              <div className="bg-[#0a0a0a]/50 backdrop-blur-sm border-b border-gray-800 p-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setSelectedConversation(null)
                      setShowMobileChat(false)
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center ring-2 ring-gray-700">
                    {selectedConversation.otherUser.image ? (
                      <Image
                        src={selectedConversation.otherUser.image}
                        alt={selectedConversation.otherUser.name || 'User'}
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
                      {selectedConversation.otherUser.name}
                    </h3>
                    <p className="text-orange-400 text-xs flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {selectedConversation.course.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 pb-4" style={{
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                scrollBehavior: 'smooth'
              }}>
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 py-12">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                      <p className="font-medium text-lg">Henüz mesaj yok</p>
                      <p className="text-sm mt-2">İlk mesajınızı gönderin ve eğitmeninizle iletişime geçin</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-3">
                        {/* Ana Mesaj */}
                        <div
                          className={`flex ${message.user.id === session.user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] ${message.user.id === session.user.id ? 'order-2' : 'order-1'}`}>
                            <div className="flex items-end space-x-2 mb-1">
                              {message.user.id !== session.user.id && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center flex-shrink-0">
                                  {message.user.image ? (
                                    <Image
                                      src={message.user.image}
                                      alt={message.user.name || 'User'}
                                      width={32}
                                      height={32}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <User className="h-4 w-4 text-white" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1">
                                <div
                                  className={`px-4 py-3 rounded-2xl shadow-lg ${message.user.id === session.user.id
                                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-br-sm'
                                    : 'bg-[#1a1a1a] text-gray-100 rounded-bl-sm'
                                    }`}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                <div className="flex items-center justify-between mt-1 px-2">
                                  <p className={`text-xs ${message.user.id === session.user.id ? 'text-orange-300' : 'text-gray-400'
                                    }`}>
                                    {formatMessageTime(message.createdAt)}
                                  </p>
                                  {message.user.id !== session.user.id && (
                                    <button
                                      onClick={() => setReplyingTo(message)}
                                      className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                                    >
                                      Yanıtla
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Yanıtlar */}
                            {message.replies.length > 0 && (
                              <div className="ml-10 mt-3 space-y-2">
                                {message.replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className={`flex ${reply.user.id === session.user.id ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`px-4 py-2.5 rounded-xl text-sm max-w-[85%] shadow ${reply.user.id === session.user.id
                                        ? 'bg-orange-500/80 text-white'
                                        : 'bg-[#1a1a1a] text-gray-100'
                                        }`}
                                    >
                                      <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                                      <p className={`text-xs mt-1 ${reply.user.id === session.user.id ? 'text-orange-200' : 'text-gray-300'
                                        }`}>
                                        {formatMessageTime(reply.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Mobile Chat Input */}
              {replyingTo && (
                <div className="px-4 py-2 bg-[#0a0a0a]/80 backdrop-blur-sm border-t border-gray-800 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center space-x-2 text-sm flex-1">
                    <ChevronLeft className="h-4 w-4 text-orange-500 rotate-180 flex-shrink-0" />
                    <span className="text-gray-300 text-xs truncate">
                      <span className="text-orange-400 font-medium">{replyingTo.user.name}</span> kullanıcısına yanıt
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="p-3 border-t border-gray-800 bg-[#0a0a0a]/95 backdrop-blur-sm flex-shrink-0 sticky bottom-0">
                <div className="flex space-x-2 items-end">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 bg-[#1a1a1a] text-white p-3 rounded-xl border border-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none transition-all max-h-32"
                    rows={1}
                    disabled={sending}
                    style={{
                      minHeight: '44px',
                      maxHeight: '120px',
                      lineHeight: '20px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-3 rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg mb-1"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Konuşma Listesi */}
          <div className={`lg:col-span-1 ${showMobileChat ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-[#0a0a0a] backdrop-blur-sm rounded-xl border border-gray-800 flex flex-col shadow-xl" style={{ height: 'calc(100vh - 140px)' }}>
              <div className="p-4 border-b border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Konuşmalarda ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">
                    <Clock className="h-8 w-8 mx-auto mb-3 animate-spin text-orange-500" />
                    <p className="text-sm">Yükleniyor...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <p className="font-medium">Henüz konuşma yok</p>
                    <p className="text-sm mt-1">Eğitmeninize ilk mesajınızı gönderin</p>
                  </div>
                ) : (
                  conversations
                    .filter(conv =>
                      conv.otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      conv.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((conversation) => (
                      <div
                        key={conversation.otherUser.id + conversation.course.id}
                        onClick={() => {
                          setSelectedConversation(conversation)
                          setShowMobileChat(true)
                        }}
                        className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-[#1a1a1a] transition-all ${selectedConversation?.otherUser.id === conversation.otherUser.id &&
                          selectedConversation?.course.id === conversation.course.id
                          ? 'bg-gradient-to-r from-orange-600/20 to-transparent border-l-4 border-l-orange-500'
                          : ''
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center ring-2 ring-gray-700">
                              {conversation.otherUser.image ? (
                                <Image
                                  src={conversation.otherUser.image}
                                  alt={conversation.otherUser.name || 'User'}
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                />
                              ) : (
                                <User className="h-6 w-6 text-white" />
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="text-white font-semibold truncate text-sm">
                                {conversation.otherUser.name}
                              </h3>
                              <span className="text-gray-400 text-xs flex-shrink-0 ml-2">
                                {formatTime(conversation.lastMessageTime)}
                              </span>
                            </div>
                            <p className="text-orange-400 text-xs mb-1.5 flex items-center">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {conversation.course.title}
                            </p>
                            <p className="text-gray-400 text-sm line-clamp-1">
                              {conversation.lastMessage.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Mesaj Alanı */}
          <div className={`lg:col-span-2 ${showMobileChat ? 'block' : 'hidden lg:block'}`}>
            {selectedConversation ? (
              <div className="bg-[#0a0a0a] backdrop-blur-sm rounded-xl border border-gray-800 flex flex-col shadow-xl" style={{ height: 'calc(100vh - 140px)' }}>
                {/* Mesaj Header */}
                <div className="p-4 border-b border-gray-800 bg-[#0a0a0a]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedConversation(null)
                          setShowMobileChat(false)
                        }}
                        className="lg:hidden text-gray-400 hover:text-white"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center ring-2 ring-gray-700">
                        {selectedConversation.otherUser.image ? (
                          <Image
                            src={selectedConversation.otherUser.image}
                            alt={selectedConversation.otherUser.name || 'User'}
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
                          {selectedConversation.otherUser.name}
                        </h3>
                        <p className="text-orange-400 text-xs flex items-center">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {selectedConversation.course.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mesajlar */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{
                  maxHeight: 'calc(100vh - 300px)',
                  overflowY: 'auto',
                  scrollBehavior: 'smooth'
                }}>
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 py-12">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                        <p className="font-medium text-lg">Henüz mesaj yok</p>
                        <p className="text-sm mt-2">İlk mesajınızı gönderin ve eğitmeninizle iletişime geçin</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div key={message.id} className="space-y-3">
                          {/* Ana Mesaj */}
                          <div
                            className={`flex ${message.user.id === session.user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] ${message.user.id === session.user.id ? 'order-2' : 'order-1'}`}>
                              <div className="flex items-end space-x-2 mb-1">
                                {message.user.id !== session.user.id && (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center flex-shrink-0">
                                    {message.user.image ? (
                                      <Image
                                        src={message.user.image}
                                        alt={message.user.name || 'User'}
                                        width={32}
                                        height={32}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <User className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div
                                    className={`px-4 py-3 rounded-2xl shadow-lg ${message.user.id === session.user.id
                                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-br-sm'
                                      : 'bg-[#1a1a1a] text-gray-100 rounded-bl-sm'
                                      }`}
                                  >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 px-2">
                                    <p className={`text-xs ${message.user.id === session.user.id ? 'text-orange-300' : 'text-gray-400'
                                      }`}>
                                      {formatMessageTime(message.createdAt)}
                                    </p>
                                    {message.user.id !== session.user.id && (
                                      <button
                                        onClick={() => setReplyingTo(message)}
                                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                                      >
                                        Yanıtla
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Yanıtlar */}
                              {message.replies.length > 0 && (
                                <div className="ml-10 mt-3 space-y-2">
                                  {message.replies.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className={`flex ${reply.user.id === session.user.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`px-4 py-2.5 rounded-xl text-sm max-w-[85%] shadow ${reply.user.id === session.user.id
                                          ? 'bg-orange-500/80 text-white'
                                          : 'bg-[#1a1a1a] text-gray-100'
                                          }`}
                                      >
                                        <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                                        <p className={`text-xs mt-1 ${reply.user.id === session.user.id ? 'text-orange-200' : 'text-gray-300'
                                          }`}>
                                          {formatMessageTime(reply.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Yanıtlama Bildirimi */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-[#0a0a0a]/50 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                      <ChevronLeft className="h-4 w-4 text-orange-500 rotate-180" />
                      <span className="text-gray-400">
                        <span className="text-orange-400">{replyingTo.user.name}</span> kullanıcısına yanıt veriyorsunuz
                      </span>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Mesaj Gönderme */}
                <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                  <div className="flex space-x-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 bg-gray-700/50 text-white p-3 rounded-xl border border-gray-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none transition-all"
                      rows={2}
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-5 py-2 rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg self-end"
                    >
                      <Send className="h-5 w-5" />
                      <span className="hidden sm:inline">Gönder</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 h-full flex items-center justify-center shadow-xl">
                <div className="text-center text-gray-400 p-8">
                  <MessageSquare className="h-20 w-20 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-white font-semibold text-lg mb-2">Konuşma Seçin</h3>
                  <p className="text-sm">Mesajlaşmak istediğiniz eğitmeni seçin</p>
                  <button
                    onClick={() => setShowNewMessageModal(true)}
                    className="mt-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-2.5 rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all inline-flex items-center space-x-2 shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Yeni Sohbet Başlat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yeni Mesaj Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-semibold text-xl">Yeni Mesaj Başlat</h3>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {instructors.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <p className="font-medium text-lg mb-2">Henüz kursa kayıtlı değilsiniz</p>
                  <p className="text-sm">Eğitmeninize mesaj atabilmek için önce bir kursa kaydolmanız gerekiyor</p>
                  <Link
                    href="/home"
                    className="mt-4 inline-block bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-2.5 rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all"
                  >
                    Kursları İncele
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {instructors.map((instructor) => (
                    <div key={instructor.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center ring-2 ring-gray-600">
                          {instructor.image ? (
                            <Image
                              src={instructor.image}
                              alt={instructor.name || 'User'}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <User className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{instructor.name}</h4>
                          <p className="text-gray-400 text-sm">{instructor.email}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm font-medium">Kayıtlı Kurslar:</p>
                        {instructor.courses.map((course) => (
                          <button
                            key={course.id}
                            onClick={() => startNewConversation(instructor, course)}
                            className="w-full flex items-center space-x-3 p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg border border-gray-600 hover:border-orange-500 transition-all text-left group"
                          >
                            <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                              {course.imageUrl ? (
                                <Image
                                  src={course.imageUrl}
                                  alt={course.title}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="text-white font-medium text-sm group-hover:text-orange-400 transition-colors">{course.title}</h5>
                              {course.lessonCount && (
                                <p className="text-gray-400 text-xs">{course.lessonCount} ders</p>
                              )}
                            </div>
                            <ChevronLeft className="h-5 w-5 text-gray-400 group-hover:text-orange-400 rotate-180 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Sosyal</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center py-2 px-3 text-orange-500 relative">
            <div className="relative">
              <MessageCircle className="h-6 w-6" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
