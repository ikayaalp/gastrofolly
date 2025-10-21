"use client"

import { useEffect, useState } from "react"

export default function AuthBackground() {
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/search?q=ar")
        const data = await res.json()
        if (mounted && Array.isArray(data?.courses)) {
          const imgs = data.courses
            .map((c: { imageUrl?: string | null }) => c.imageUrl)
            .filter((u: string | null | undefined): u is string => Boolean(u))
          setImages(imgs)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const FALLBACK: string[] = [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
  ]

  const sources = [...images, ...FALLBACK]
  const tiles = sources.length ? Array.from({ length: 48 }, (_, i) => sources[i % sources.length]) : FALLBACK

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="w-full h-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-4 auto-rows-[7rem] sm:auto-rows-[8rem] md:auto-rows-[9rem] lg:auto-rows-[10rem] bg-black">
        {tiles.map((src, i) => (
          <img key={i} src={src} alt="course" className="w-full h-full object-cover rounded-lg opacity-75" loading="lazy" />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </div>
  )
}


