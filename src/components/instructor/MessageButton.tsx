"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MessageCircle, Send } from "lucide-react"

interface MessageButtonProps {
  instructorId: string
  instructorName: string
  courseId?: string
}

export default function MessageButton({ instructorId, instructorName, courseId }: MessageButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [availableCourses, setAvailableCourses] = useState<Array<{
    id: string
    title: string
    description: string
    price: number
    imageUrl: string | null
    isPublished: boolean
    createdAt: Date
    _count: {
      enrollments: number
    }
  }>>([])
  const [selectedCourseId, setSelectedCourseId] = useState("")

  const handleSendMessage = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (!message.trim()) {
      alert("Lütfen bir mesaj yazın.")
      return
    }

    const finalCourseId = courseId || selectedCourseId
    if (!finalCourseId) {
      alert("Lütfen bir kurs seçin.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message.trim(),
          courseId: finalCourseId
        })
      })

      if (response.ok) {
        alert(`Mesaj ${instructorName} eğitmenine gönderildi!`)
        setMessage("")
        setSelectedCourseId("")
        setIsOpen(false)
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Mesaj gönderilirken bir hata oluştu.")
      }
    } catch (error) {
      console.error("Message send error:", error)
      alert("Mesaj gönderilirken bir hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenMessage = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    // Eğer courseId verilmemişse, kullanıcının bu eğitmenin kurslarına kayıtlı olup olmadığını kontrol et
    if (!courseId) {
      try {
        const response = await fetch(`/api/instructor/${instructorId}/courses`)
        if (response.ok) {
          const data = await response.json()
          setAvailableCourses(data.courses || [])
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      }
    }
    
    setIsOpen(true)
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpenMessage}
        className="w-full flex items-center justify-center py-3 px-4 rounded-lg border-2 border-gray-600 bg-gray-800 text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all duration-300"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        Mesaj Gönder
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Message Modal */}
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <h3 className="text-white font-semibold mb-4">
                {instructorName} Eğitmenine Mesaj Gönder
              </h3>
              
              {!courseId && availableCourses.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kurs Seçin
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="">Kurs seçin...</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="mb-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 resize-none"
                  rows={4}
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Gönder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
