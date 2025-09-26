"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { 
  MessageSquare, 
  Send, 
  User, 
  Search,
  ChevronLeft,
  Users,
  Clock
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
  createdCourses?: {
    id: string
    title: string
    imageUrl: string | null
  }[]
}

interface DirectMessage {
  id: string
  content: string
  createdAt: Date
  isRead: boolean
  sender: User
  receiver: User
}

interface Conversation {
  otherUser: User
  lastMessage: DirectMessage
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
  session: Session
}

export default function MessagesClient({ session }: Props) {
  const searchParams = useSearchParams()
  const instructorIdFromUrl = searchParams.get('instructorId')
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [instructors, setInstructors] = useState<User[]>([])
  const [showInstructors, setShowInstructors] = useState(false)
  const [loading, setLoading] = useState(true)

  // Konuşmaları yükle
  useEffect(() => {
    fetchConversations()
  }, [])

  // URL'den gelen instructorId ile konuşma aç
  useEffect(() => {
    if (instructorIdFromUrl && conversations.length > 0) {
      const existingConversation = conversations.find(conv => conv.otherUser.id === instructorIdFromUrl)
      if (existingConversation) {
        setSelectedConversation(existingConversation)
      } else {
        // Eğer konuşma yoksa, eğitmen bilgilerini al ve yeni konuşma başlat
        fetchInstructorAndStartConversation(instructorIdFromUrl)
      }
    }
  }, [instructorIdFromUrl, conversations])

  // Mesajları yükle
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.otherUser.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/direct-messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (otherUserId: string) => {
    try {
      const response = await fetch(`/api/direct-messages?otherUserId=${otherUserId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchInstructors = async (search: string = "") => {
    try {
      const response = await fetch(`/api/direct-messages/users?search=${search}`)
      if (response.ok) {
        const data = await response.json()
        setInstructors(data.instructors)
      }
    } catch (error) {
      console.error('Error fetching instructors:', error)
    }
  }

  const fetchInstructorAndStartConversation = async (instructorId: string) => {
    try {
      const response = await fetch(`/api/direct-messages/users?search=`)
      if (response.ok) {
        const data = await response.json()
        const instructor = data.instructors.find((inst: User) => inst.id === instructorId)
        if (instructor) {
          startNewConversation(instructor)
        }
      }
    } catch (error) {
      console.error('Error fetching instructor:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedConversation.otherUser.id
        }),
      })

      if (response.ok) {
        setNewMessage("")
        fetchMessages(selectedConversation.otherUser.id)
        fetchConversations() // Konuşma listesini güncelle
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const startNewConversation = async (instructor: User) => {
    setSelectedConversation({
      otherUser: instructor,
      lastMessage: {
        id: '',
        content: '',
        createdAt: new Date(),
        isRead: true,
        sender: session.user as User,
        receiver: instructor
      },
      unreadCount: 0
    })
    setShowInstructors(false)
    setMessages([])
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
    if (minutes < 60) return `${minutes}dk`
    if (hours < 24) return `${hours}sa`
    if (days < 7) return `${days}g`
    return new Date(date).toLocaleDateString('tr-TR')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <h1 className="text-2xl font-bold text-white">Mesajlar</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setShowInstructors(!showInstructors)
                  if (!showInstructors) {
                    fetchInstructors()
                  }
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Yeni Konuşma</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
          {/* Konuşma Listesi */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
              <div className="p-4 border-b border-gray-700">
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
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-400">
                    <Clock className="h-6 w-6 mx-auto mb-2 animate-spin" />
                    Yükleniyor...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>Henüz konuşma yok</p>
                    <p className="text-sm">Yeni konuşma başlatın</p>
                  </div>
                ) : (
                  conversations
                    .filter(conv => 
                      conv.otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((conversation) => (
                      <div
                        key={conversation.otherUser.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                          selectedConversation?.otherUser.id === conversation.otherUser.id ? 'bg-gray-700' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center relative">
                            {conversation.otherUser.image ? (
                              <Image
                                src={conversation.otherUser.image}
                                alt={conversation.otherUser.name || 'User'}
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
                                {conversation.otherUser.name}
                              </h3>
                              <span className="text-gray-400 text-xs">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mt-1 line-clamp-2">
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
          <div className="lg:col-span-3">
            {selectedConversation ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
                {/* Mesaj Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
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
                      <p className="text-gray-400 text-sm">
                        {selectedConversation.otherUser.role === 'INSTRUCTOR' ? 'Eğitmen' : 'Öğrenci'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mesajlar */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                      <p>Henüz mesaj yok</p>
                      <p className="text-sm">İlk mesajınızı gönderin</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender.id === session.user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender.id === session.user.id
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender.id === session.user.id ? 'text-orange-200' : 'text-gray-400'
                            }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Mesaj Gönderme */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none resize-none"
                      rows={2}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Konuşma Seçin</h3>
                  <p>Mesajlaşmak istediğiniz kişiyi seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chef Seçim Modal */}
      {showInstructors && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md mx-4 max-h-96">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-semibold">Chef Seçin</h3>
                <button
                  onClick={() => setShowInstructors(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Chef ara..."
                  onChange={(e) => fetchInstructors(e.target.value)}
                  className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {instructors.map((instructor) => (
                <div
                  key={instructor.id}
                  onClick={() => startNewConversation(instructor)}
                  className="p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
                      {instructor.image ? (
                        <Image
                          src={instructor.image}
                          alt={instructor.name || 'User'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{instructor.name}</h4>
                      <p className="text-gray-400 text-sm">{instructor.email}</p>
                      {instructor.createdCourses && instructor.createdCourses.length > 0 && (
                        <p className="text-orange-500 text-xs mt-1">
                          {instructor.createdCourses.length} kurs
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
