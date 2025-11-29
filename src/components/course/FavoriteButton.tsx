"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { useFavorites } from "@/contexts/FavoritesContext"

interface FavoriteButtonProps {
  courseId: string
  title: string
  price: number
  discountedPrice?: number
  imageUrl?: string
  instructor: {
    name: string
  }
  category: {
    name: string
  }
  level: string
  _count: {
    lessons: number
    enrollments: number
  }
}

export default function FavoriteButton({
  courseId,
  title,
  price,
  discountedPrice,
  imageUrl,
  instructor,
  category,
  level,
  _count
}: FavoriteButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  const [isLoading, setIsLoading] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  const isInFavorites = isFavorite(courseId)

  const handleToggleFavorite = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    setIsLoading(true)
    setShowAnimation(true)

    try {
      const favoriteItem = {
        id: courseId,
        title,
        price,
        discountedPrice,
        imageUrl,
        instructor,
        category,
        level,
        _count
      }

      if (isInFavorites) {
        removeFavorite(courseId)
      } else {
        addFavorite(favoriteItem)
      }

      // Remove animation after 1 second
      setTimeout(() => {
        setShowAnimation(false)
      }, 1000)

    } catch (error) {
      console.error("Favorite toggle error:", error)
      alert("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        w-full flex items-center justify-center py-3 px-4 rounded-lg border-2 transition-all duration-300
        ${isInFavorites
          ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
          : 'bg-black border-orange-500/30 text-white hover:border-red-500 hover:text-red-500'
        }
        ${showAnimation ? 'animate-pulse' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <Heart
        className={`
          h-5 w-5 mr-2 transition-all duration-300
          ${isInFavorites ? 'fill-current' : ''}
          ${showAnimation ? 'scale-125' : ''}
        `}
      />
      {isInFavorites ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
    </button>
  )
}
