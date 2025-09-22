"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"

interface EnrollButtonProps {
  courseId: string
  price: number
}

export default function EnrollButton({ courseId, price }: EnrollButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleEnroll = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    setIsLoading(true)

    try {
      // Direkt enrollment API'sini çağır (ödeme işlemi olmadan)
      const response = await fetch("/api/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Başarılı kayıt sonrası learn sayfasına yönlendir
        router.push(`/learn/${courseId}`)
      } else {
        console.error("Enrollment error:", data.error)
        alert(data.error || "Kursa kayıt olurken bir hata oluştu.")
      }
    } catch (error) {
      console.error("Enrollment error:", error)
      alert("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={isLoading}
      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Yönlendiriliyor...
        </div>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" />
          Satın Al
        </>
      )}
    </button>
  )
}
