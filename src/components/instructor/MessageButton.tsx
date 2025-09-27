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
    
    // Chef'e Sor sayfasına yönlendir ve eğitmen ID'sini query parameter olarak gönder
    router.push(`/chef-sor?instructorId=${instructorId}`)
  }

  return (
    <button
      onClick={handleOpenMessage}
      className="w-full flex items-center justify-center py-3 px-4 rounded-lg border-2 border-gray-600 bg-gray-800 text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all duration-300"
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      Mesaj Gönder
    </button>
  )
}
