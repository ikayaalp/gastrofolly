"use client"

import { useState } from "react"
import { Tag, Check, X, AlertCircle } from "lucide-react"

interface DiscountCodeProps {
  onDiscountApplied: (discount: { code: string; percentage: number; amount: number }) => void
  onDiscountRemoved: () => void
  appliedDiscount?: { code: string; percentage: number; amount: number } | null
  subtotal: number
}

export default function DiscountCode({ 
  onDiscountApplied, 
  onDiscountRemoved, 
  appliedDiscount,
  subtotal 
}: DiscountCodeProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError("Lütfen bir indirim kodu girin.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: code.trim().toUpperCase(),
          subtotal 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onDiscountApplied(data.discount)
        setCode("")
      } else {
        setError(data.error || "Geçersiz indirim kodu.")
      }
    } catch (error) {
      console.error('Discount code error:', error)
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDiscount = () => {
    onDiscountRemoved()
    setError("")
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">

      {appliedDiscount ? (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-green-400 font-medium">
                  {appliedDiscount.code} kodu uygulandı
                </p>
                <p className="text-green-300 text-sm">
                  %{appliedDiscount.percentage} indirim - ₺{appliedDiscount.amount.toLocaleString('tr-TR')} tasarruf
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveDiscount}
              className="text-red-400 hover:text-red-300 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="İndirim kodu"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
            />
            <button
              onClick={handleApplyCode}
              disabled={isLoading || !code.trim()}
              className="bg-orange-600 text-white px-2 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-0 border-0 flex-shrink-0 whitespace-nowrap"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Uygula"
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
