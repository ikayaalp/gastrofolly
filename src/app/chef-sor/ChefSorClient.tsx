"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  MessageCircle, 
  Send, 
  ChefHat, 
  BookOpen, 
  Users,
  Search,
  Clock,
  Star,
  Home,
  Bell
} from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

interface Instructor {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Course {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string | null
  isPublished: boolean
  createdAt: Date
  instructor: Instructor
  category: {
    name: string
  }
  _count: {
    enrollments: number
  }
}

interface Message {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  course: {
    id: string
    title: string
    imageUrl: string | null
  }
  replies: Array<{
    id: string
    content: string
    createdAt: Date
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }>
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

interface ChefSorClientProps {
  enrolledCourses: Course[]
  session: Session
  selectedInstructorId?: string
}

export default function ChefSorClient({ enrolledCourses, session, selectedInstructorId }: ChefSorClientProps) {
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Benzersiz eğitmenleri al
  const uniqueInstructors = enrolledCourses.reduce((acc, course) => {
    const instructor = course.instructor
    if (!acc.find(i => i.id === instructor.id)) {
      acc.push(instructor)
    }
    return acc
  }, [] as Instructor[])

  // Filtrelenmiş eğitmenler
  const filteredInstructors = uniqueInstructors.filter(instructor =>
    instructor.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Mesajları yükle
  const loadMessages = async (courseId: string) => {
    try {
      const response = await fetch(`/api/messages?courseId=${courseId}&instructorId=${selectedInstructor?.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Mesaj gönder
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCourse) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          courseId: selectedCourse.id
        })
      })

      if (response.ok) {
        setNewMessage("")
        loadMessages(selectedCourse.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // URL'den gelen instructorId ile eğitmeni otomatik seç
  useEffect(() => {
    if (selectedInstructorId && uniqueInstructors.length > 0) {
      const instructor = uniqueInstructors.find(i => i.id === selectedInstructorId)
      if (instructor) {
        setSelectedInstructor(instructor)
        // İlk kursu otomatik seç
        const firstCourse = enrolledCourses.find(c => c.instructor.id === instructor.id)
        if (firstCourse) {
          setSelectedCourse(firstCourse)
          loadMessages(firstCourse.id)
        }
      }
    }
  }, [selectedInstructorId, uniqueInstructors, enrolledCourses])

  // Eğitmen seçildiğinde
  const handleInstructorSelect = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    // Bu eğitmenin kurslarını bul
    const instructorCourses = enrolledCourses.filter(course => course.instructor.id === instructor.id)
    if (instructorCourses.length > 0) {
      setSelectedCourse(instructorCourses[0])
      loadMessages(instructorCourses[0].id)
    }
  }

  // Kurs değiştirildiğinde
  const handleCourseChange = (course: Course) => {
    setSelectedCourse(course)
    loadMessages(course.id)
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
                {session?.user?.role === 'ADMIN' && (
                  <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                )}
              </Link>
              <nav className="flex space-x-6">
                <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
                <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurslarım
                </Link>
                {session?.user?.role === 'ADMIN' && (
                  <>
                    <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                      Admin Paneli
                    </Link>
                    <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                      Kurs Yönetimi
                    </Link>
                  </>
                )}
                <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                  Chef Sosyal
                </Link>
                <Link href="/chef-sor" className="text-white font-semibold">
                  Mesajlar
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  İletişim
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-white">
                <Search className="h-5 w-5" />
              </button>
              <button className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </button>
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
          </Link>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-300 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <UserDropdown />
          </div>
        </div>
      </div>

      <div className="pt-16 md:pt-24 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Sol Panel - Eğitmen Listesi */}
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white mb-4">Eğitmenlerin</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Eğitmen ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {filteredInstructors.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  {searchTerm ? "Eğitmen bulunamadı" : "Henüz hiç kurs satın almamışsınız"}
                </p>
              ) : (
                filteredInstructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    onClick={() => handleInstructorSelect(instructor)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedInstructor?.id === instructor.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center">
                        {instructor.image ? (
                          <Image
                            src={instructor.image}
                            alt={instructor.name || 'Eğitmen'}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {instructor.name?.charAt(0).toUpperCase() || 'E'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {instructor.name || 'Eğitmen'}
                        </p>
                        <p className="text-sm opacity-75 truncate">
                          {enrolledCourses.filter(c => c.instructor.id === instructor.id).length} kurs
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Orta Panel - Kurs Seçimi */}
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Kurslar</h2>
            
            {!selectedInstructor ? (
              <p className="text-gray-400 text-center py-8">
                Önce bir eğitmen seçin
              </p>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {enrolledCourses
                  .filter(course => course.instructor.id === selectedInstructor.id)
                  .map((course) => (
                    <div
                      key={course.id}
                      onClick={() => handleCourseChange(course)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedCourse?.id === course.id
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {course.imageUrl ? (
                          <Image
                            src={course.imageUrl}
                            alt={course.title}
                            width={60}
                            height={40}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="w-15 h-10 bg-gray-600 rounded flex items-center justify-center">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{course.title}</h3>
                          <p className="text-sm opacity-75 truncate">{course.category.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Users className="h-3 w-3" />
                            <span className="text-xs">{course._count.enrollments} öğrenci</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Sağ Panel - Mesajlaşma */}
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col">
            {/* Mesaj Header */}
            <div className="mb-4 pb-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Mesajlaşma</h2>
              {selectedCourse && (
                <div className="mt-2">
                  <p className="text-sm text-gray-400">{selectedCourse.title}</p>
                  {selectedInstructor && (
                    <div className="flex items-center mt-2 space-x-2">
                      <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center">
                        {selectedInstructor.image ? (
                          <Image
                            src={selectedInstructor.image}
                            alt={selectedInstructor.name || 'Eğitmen'}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="text-white text-xs font-semibold">
                            {selectedInstructor.name?.charAt(0).toUpperCase() || 'E'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-300">
                        {selectedInstructor.name || 'Eğitmen'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!selectedCourse ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-center">
                  Mesajlaşmak için bir kurs seçin
                </p>
              </div>
            ) : (
              <>
                {/* Mesaj Listesi */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-800 max-h-[300px] md:max-h-[400px] pr-2 pl-1">
                  {messages.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      Henüz mesaj yok. İlk mesajı siz gönderin!
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="space-y-3 mb-4">
                        {/* Ana Mesaj */}
                        <div
                          className={`flex ${
                            message.user.id === session.user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                              message.user.id === session.user.id
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Yanıtlar */}
                        {message.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`flex ${
                              reply.user.id === session.user.id ? 'justify-end' : 'justify-start'
                            } ml-6 mt-2`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                                reply.user.id === session.user.id
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-gray-700 text-gray-300'
                              }`}
                            >
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

                {/* Mesaj Gönderme */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !newMessage.trim()}
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
          <Link href="/chef-sor" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
