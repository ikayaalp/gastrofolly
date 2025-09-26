"use client"

import { useState } from "react"
import { 
  MessageSquare, 
  Reply, 
  Send, 
  User, 
  Calendar,
  BookOpen,
  Search,
  Filter,
  MoreVertical
} from "lucide-react"
import Image from "next/image"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
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
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("all")

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         message.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCourse = filterCourse === "all" || message.course.id === filterCourse
    
    return matchesSearch && matchesCourse
  })

  const uniqueCourses = messages.reduce((acc, message) => {
    if (!acc.find(course => course.id === message.course.id)) {
      acc.push(message.course)
    }
    return acc
  }, [] as Course[])

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
    <div className="min-h-screen bg-gray-900 pt-20">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Mesaj Yönetimi</h1>
              <p className="text-gray-400">Öğrencilerden gelen mesajları yanıtlayın</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mesajlarda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
              >
                <option value="all">Tüm Kurslar</option>
                {uniqueCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Mesajlar ({filteredMessages.length})</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
                        {message.user.image ? (
                          <Image
                            src={message.user.image}
                            alt={message.user.name || 'User'}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-white font-medium truncate">{message.user.name}</h3>
                          <span className="text-gray-400 text-xs">
                            {new Date(message.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-orange-500 text-sm font-medium">{message.course.title}</p>
                        <p className="text-gray-300 text-sm mt-1 line-clamp-2">{message.content}</p>
                        {message.replies.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            <Reply className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400 text-xs">{message.replies.length} yanıt</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700">
                {/* Message Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center">
                      {selectedMessage.user.image ? (
                        <Image
                          src={selectedMessage.user.image}
                          alt={selectedMessage.user.name || 'User'}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-semibold">{selectedMessage.user.name}</h3>
                          <p className="text-gray-400 text-sm">{selectedMessage.user.email}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(selectedMessage.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <BookOpen className="h-4 w-4 text-orange-500" />
                        <span className="text-orange-500 text-sm font-medium">{selectedMessage.course.title}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-6">
                  <div className="bg-gray-700 rounded-lg p-4 mb-6">
                    <p className="text-gray-300 leading-relaxed">{selectedMessage.content}</p>
                  </div>

                  {/* Replies */}
                  {selectedMessage.replies.length > 0 && (
                    <div className="space-y-4 mb-6">
                      <h4 className="text-white font-semibold">Yanıtlar</h4>
                      {selectedMessage.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                              {reply.user.image ? (
                                <Image
                                  src={reply.user.image}
                                  alt={reply.user.name || 'User'}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <User className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h5 className="text-white font-medium text-sm">{reply.user.name}</h5>
                                <span className="text-gray-400 text-xs">
                                  {new Date(reply.createdAt).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm mt-1">{reply.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  <div>
                    <h4 className="text-white font-semibold mb-4">Yanıtla</h4>
                    <div className="space-y-4">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        className="w-full bg-gray-700 text-white p-4 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none resize-none"
                        rows={4}
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleReply(selectedMessage.id)}
                          disabled={!replyContent.trim()}
                          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Send className="h-4 w-4" />
                          <span>Gönder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Mesaj Seçin</h3>
                <p className="text-gray-400">Yanıtlamak istediğiniz mesajı seçin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
