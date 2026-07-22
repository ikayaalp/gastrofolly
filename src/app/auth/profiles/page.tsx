"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut, Loader2, Play } from "lucide-react"
import Image from "next/image"
import { toast } from "react-hot-toast"

export default function ProfilesPage() {
  const { data: session, update, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if not logged in at all (e.g., hard logged out)
  if (status === "unauthenticated") {
    router.push("/auth/signin")
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
  const userImage = session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=ea580c&color=fff&size=256`

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-black to-black"></div>
      
      <div className="z-10 flex flex-col items-center w-full max-w-4xl px-4 animate-in fade-in duration-1000">
        <h1 className="text-4xl md:text-5xl font-light text-center mb-16 tracking-wide text-white/90">
          Kim İzliyor?
        </h1>

        <div className="flex flex-col items-center justify-center group cursor-pointer" onClick={handleProfileSelect}>
          <div className="relative">
            {/* Avatar Container with hover effects */}
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-4 border-transparent group-hover:border-white transition-all duration-300 transform group-hover:scale-105 shadow-2xl relative ${isLoading ? 'opacity-50' : ''}`}>
              <Image 
                src={userImage}
                alt={userName}
                fill
                className="object-cover"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <Play className="w-12 h-12 text-white ml-2" fill="currentColor" />
                )}
              </div>
            </div>
            
            {/* Loading Indicator for specific profile */}
            {isLoading && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                <div className="bg-orange-600 rounded-full p-1.5 shadow-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              </div>
            )}
          </div>
          
          <h2 className="mt-6 text-xl md:text-2xl text-gray-400 group-hover:text-white font-medium transition-colors duration-300">
            {userName}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="mt-24">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-all duration-300 hover:bg-white/5"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium tracking-wide">Farklı Bir Hesapla Giriş Yap</span>
          </button>
        </div>
      </div>
    </div>
  )
}
