"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"

interface MessageButtonProps {
  instructorId: string
  instructorName: string
  courseId?: string
}

export default function MessageButton({ instructorId, instructorName, courseId }: MessageButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleOpenMessage = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    // Yeni mesajlaşma sistemine yönlendir
    const params = new URLSearchParams({ instructorId })
    if (courseId) {
      params.append('courseId', courseId)
    }
    router.push(`/messages?${params.toString()}`)
  }

  return (
    <button
      onClick={handleOpenMessage}
      className="w-full flex items-center justify-center py-3 px-4 rounded-lg border-2 border-orange-600 bg-gradient-to-r from-orange-600/10 to-orange-500/10 text-orange-500 hover:border-orange-500 hover:from-orange-600/20 hover:to-orange-500/20 transition-all duration-300"
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      Şefe Mesaj Gönder
    </button>
  )
}
