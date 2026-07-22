"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

function SessionListener() {
  const { data: session } = useSession()
  const hasLoggedOut = useRef(false)

  const router = useRouter()
  
  useEffect(() => {
    if ((session as any)?.error === 'ConcurrentLogin' && !hasLoggedOut.current) {
      hasLoggedOut.current = true;
      toast.error("Başka bir cihazdan giriş yapıldı. Mevcut cihazdan devam etmek için profilinizi seçin.", {
        duration: 5000,
        icon: '⚠️',
      })
      setTimeout(() => {
        router.push('/auth/profiles')
      }, 2000)
    }
  }, [session, router])

  return null
}

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <SessionListener />
      {children}
    </SessionProvider>
  )
}
