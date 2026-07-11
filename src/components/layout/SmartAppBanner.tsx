"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

export default function SmartAppBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Sadece tarayıcıda çalışır
    if (typeof window === 'undefined') return

    const hideBanner = localStorage.getItem('hideAppBanner')
    if (hideBanner === 'true') return

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera

    // iOS kontrolü (iPhone, iPad, iPod)
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream

    if (isIOS) {
      // iOS'te Safari native banner'ı zaten gösteriyor. Biz sadece Chrome/Firefox için göstereceğiz.
      const isChrome = /CriOS|Chrome/.test(ua)
      const isFirefox = /FxiOS/.test(ua)
      
      if (isChrome || isFirefox) {
        setIsVisible(true)
      }
    }
    // Android ise false kalır (Android uygulama çıkana kadar)
  }, [])

  if (!isVisible) return null

  const handleClose = () => {
    localStorage.setItem('hideAppBanner', 'true')
    setIsVisible(false)
  }

  const appStoreUrl = "https://apps.apple.com/app/id6760206517"

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-8 pointer-events-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 flex items-center justify-between pointer-events-auto">
        
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="Culinora" 
            width={48} 
            height={48} 
            className="rounded-xl object-cover bg-black"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Culinora App</span>
            <span className="text-xs text-zinc-400">Daha iyi bir deneyim için</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a 
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
          >
            İndir
          </a>
          <button onClick={handleClose} className="p-2 text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  )
}
