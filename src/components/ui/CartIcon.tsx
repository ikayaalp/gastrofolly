"use client"

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useSession } from 'next-auth/react'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default function CartIcon() {
  const { data: session, status } = useSession()
  const { state, clearCart } = useCart()
  const [isVisible, setIsVisible] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showPulse, setShowPulse] = useState(false)

  useEffect(() => {
    // Only show cart icon if user is logged in and has items
    if (!session?.user && status !== 'loading') {
      // ensure cart is hidden and cleared when logged out
      clearCart()
      setIsVisible(false)
      setShowAnimation(false)
      setShowPulse(false)
      return
    }

    if (session?.user && state.itemCount > 0) {
      setIsVisible(true)
      setShowAnimation(true)
      setShowPulse(true)
      
      // Remove bounce animation after 1.5 seconds
      const bounceTimer = setTimeout(() => {
        setShowAnimation(false)
      }, 1500)
      
      // Remove pulse animation after 3 seconds
      const pulseTimer = setTimeout(() => {
        setShowPulse(false)
      }, 3000)
      
      return () => {
        clearTimeout(bounceTimer)
        clearTimeout(pulseTimer)
      }
    } else {
      setIsVisible(false)
      setShowAnimation(false)
      setShowPulse(false)
    }
  }, [state.itemCount, session?.user, status])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-24 right-4 md:bottom-12 md:right-24 z-50">
      <Link
        href="/cart"
        className={`
          relative bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-2xl 
          transition-all duration-500 transform hover:scale-110 hover:shadow-orange-500/50
          ${showAnimation ? 'animate-bounce' : ''}
          ${showPulse ? 'animate-pulse' : ''}
          group
          w-16 h-16 md:w-20 md:h-20 flex items-center justify-center
        `}
      >
        <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-white transition-transform duration-300 group-hover:scale-110" />
        
        {/* Item count badge with enhanced animation */}
        {state.itemCount > 0 && (
          <span className={`
            absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white text-xs md:text-sm font-bold rounded-full h-5 w-5 md:h-7 md:w-7 
            flex items-center justify-center shadow-lg border-2 border-white
            ${showAnimation ? 'animate-ping' : ''}
            ${showPulse ? 'animate-pulse' : ''}
            transition-all duration-300
          `}>
            {state.itemCount}
          </span>
        )}
        
        {/* Enhanced tooltip */}
        <div className="absolute bottom-full right-0 mb-3 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap transform translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Sepetim ({state.itemCount} ürün)</span>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>

        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 group-active:animate-ping"></div>
      </Link>
    </div>
  )
}
