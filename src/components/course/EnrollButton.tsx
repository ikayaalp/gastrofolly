"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingCart, Check } from "lucide-react"
import { useCart } from "@/contexts/CartContext"

interface EnrollButtonProps {
  courseId: string
  price: number
  discountedPrice?: number
  title: string
  imageUrl?: string
  instructor: {
    name: string
  }
}

export default function EnrollButton({ 
  courseId, 
  price, 
  discountedPrice,
  title,
  imageUrl,
  instructor
}: EnrollButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addItem, state } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const isInCart = state.items.some(item => item.id === courseId)

  const handleAddToCart = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    setIsLoading(true)

    try {
      const cartItem = {
        id: courseId,
        title,
        price,
        discountedPrice,
        imageUrl,
        instructor
      }

      addItem(cartItem)
      setIsAdded(true)
      
      // Reset the added state after 2 seconds
      setTimeout(() => {
        setIsAdded(false)
      }, 2000)

    } catch (error) {
      console.error("Add to cart error:", error)
      alert("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isInCart) {
    return (
      <Link
        href="/cart"
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
      >
        <Check className="h-5 w-5 mr-2" />
        Sepette
      </Link>
    )
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Ekleniyor...
        </div>
      ) : isAdded ? (
        <>
          <Check className="h-5 w-5 mr-2" />
          Eklendi!
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" />
          Sepete Ekle
        </>
      )}
    </button>
  )
}
