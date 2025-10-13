"use client"

import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function SuccessAlert() {
  const [showAlert, setShowAlert] = useState(false)
  const [alertType, setAlertType] = useState<'success' | 'fraud_bypassed' | 'recent_payment'>('success')

  useEffect(() => {
    // URL'den parametreleri kontrol et
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const fraudBypassed = urlParams.get('fraud_bypassed')
    const recentPayment = urlParams.get('recent_payment')

    if (success) {
      if (fraudBypassed) {
        setAlertType('fraud_bypassed')
      } else if (recentPayment) {
        setAlertType('recent_payment')
      } else {
        setAlertType('success')
      }
      
      setShowAlert(true)
      
      // 5 saniye sonra alert'i gizle
      setTimeout(() => {
        setShowAlert(false)
        // URL'den parametreleri temizle
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)
      }, 5000)
    }
  }, [])

  if (!showAlert) return null

  const getAlertMessage = () => {
    switch (alertType) {
      case 'fraud_bypassed':
        return "Ödeme tamamlandı. Kursunuza hoş geldiniz!"
      case 'recent_payment':
        return "Kursunuz başarıyla satın alındı. İyi öğrenmeler!"
      default:
        return "Kursunuz başarıyla satın alındı. İyi öğrenmeler!"
    }
  }

  return (
    <div className="fixed top-20 left-4 right-4 z-40 md:top-4 md:left-auto md:right-4 md:w-96">
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-center">
          <div className="bg-green-500 rounded-full p-2 mr-3">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-green-400 font-semibold text-lg">Ödeme Başarılı!</h3>
            <p className="text-gray-300 text-sm">
              {getAlertMessage()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
