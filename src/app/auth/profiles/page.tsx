"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LogOut, Loader2, Play } from "lucide-react"
import Image from "next/image"
import { toast } from "react-hot-toast"

export default function ProfilesPage() {
  const { data: session, update, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if not logged in at all (e.g., hard logged out).
  // Render sırasında router.push React ihlali ("Cannot update Router while
  // rendering ProfilesPage") ürettiği için effect içinde yapılır.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin")
    }
  }, [status, router])

  if (status === "unauthenticated") {
    return null
  }

  const handleProfileSelect = async () => {
    try {
      setIsLoading(true)
      
      const res = await fetch('/api/auth/reclaim', {
        method: 'POST',
      })
      
      const data = await res.json()
      
      if (data.success && data.newSessionId) {
        // Update the NextAuth JWT cookie with the new session ID
        await update({ reclaimSessionId: data.newSessionId })
        toast.success("Oturumunuz başarıyla yenilendi, hoş geldiniz!")
        router.push("/home")
      } else {
        throw new Error(data.message || "Oturum yenilenemedi")
      }
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu. Lütfen tekrar giriş yapın.")
      signOut({ callbackUrl: "/auth/signin" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const userName = session?.user?.name || "Kullanıcı"
  const userImage = session?.user?.image || null
  const userInitial = userName.trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Sahne animasyonları — Tailwind animasyon plugin'i yok, keyframe'ler burada */}
      <style>{`
        @keyframes kiwFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes kiwCardIn {
          0%   { opacity: 0; transform: scale(0.72); }
          60%  { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes kiwBreath {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 0.9;  transform: scale(1.12); }
        }
        @keyframes kiwPulseRing {
          0%, 100% { box-shadow: 0 0 24px 2px rgba(234, 88, 12, 0.35); }
          50%      { box-shadow: 0 0 52px 10px rgba(234, 88, 12, 0.65); }
        }
        .kiw-title    { animation: kiwFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .kiw-card     { animation: kiwCardIn 0.65s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .kiw-actions  { animation: kiwFadeUp 0.7s 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .kiw-halo     { animation: kiwBreath 3.2s ease-in-out 1s infinite; }
        .kiw-loading  { animation: kiwPulseRing 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .kiw-title, .kiw-card, .kiw-actions { animation: none; }
          .kiw-halo, .kiw-loading { animation: none; }
        }
      `}</style>

      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-black to-black"></div>

      {/* Sinematik afiş backdrop — statik SVG, ağ isteği yok, anında yüklenir.
          (Eski kurs-kapağı kolajı her açılışta 24 Cloudinary görseli çekiyordu
          ve yavaş yükleniyordu.) */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url(/who-is-watching-bg.svg)' }}
        aria-hidden="true"
      ></div>

      <div className="z-10 flex flex-col items-center w-full max-w-4xl px-4">
        <h1 className="kiw-title text-4xl md:text-5xl font-light text-center tracking-wide text-white/90 mb-16">
          Kim İzliyor?
        </h1>

        <div className="kiw-card flex flex-col items-center justify-center group cursor-pointer" onClick={handleProfileSelect}>
          <div className="relative">
            {/* Nefes alan turuncu hale — kartın arkasında */}
            <div
              className="kiw-halo absolute -inset-5 rounded-3xl bg-orange-600/25 blur-2xl pointer-events-none"
              aria-hidden="true"
            ></div>

            {/* Gradient çerçeve + kart */}
            <div
              className={`relative p-[3px] rounded-2xl bg-gradient-to-br from-orange-500 via-orange-700/40 to-transparent transition-all duration-300 group-hover:from-orange-400 group-hover:via-orange-500/60 group-hover:shadow-[0_0_45px_rgba(234,88,12,0.5)] group-hover:scale-105 group-active:scale-95 ${isLoading ? 'kiw-loading' : ''}`}
            >
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-[13px] overflow-hidden relative bg-black">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    fill
                    className={`object-cover transition-all duration-500 group-hover:scale-110 ${isLoading ? 'opacity-40 grayscale' : ''}`}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${isLoading ? 'opacity-40' : ''}`}>
                    <span className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">{userInitial}</span>
                  </div>
                )}

                {/* Hover / loading overlay */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isLoading ? 'opacity-100 bg-black/50' : 'opacity-0 group-hover:opacity-100 bg-black/35'}`}>
                  {isLoading ? (
                    <Loader2 className="w-11 h-11 text-orange-400 animate-spin" />
                  ) : (
                    <span className="bg-orange-600/90 rounded-full p-3 shadow-xl transition-transform duration-300 group-hover:scale-110">
                      <Play className="w-7 h-7 text-white ml-0.5" fill="currentColor" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <h2 className="mt-6 text-xl md:text-2xl text-gray-400 group-hover:text-white font-medium transition-colors duration-300">
            {userName}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="kiw-actions mt-20">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-orange-500/70 hover:bg-orange-500/10 active:scale-95 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium tracking-wide">Farklı Bir Hesapla Giriş Yap</span>
          </button>
        </div>
      </div>
    </div>
  )
}
