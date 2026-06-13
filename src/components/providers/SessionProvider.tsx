"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect, useRef } from "react"
import { toast } from "react-hot-toast"

function SessionListener() {
  const { data: session } = useSession()
  const hasLoggedOut = useRef(false)

  useEffect(() => {
    if ((session as any)?.error === 'ConcurrentLogin' && !hasLoggedOut.current) {
      hasLoggedOut.current = true;
      toast.error("Hesabınıza başka bir cihazdan giriş yapıldı. Güvenliğiniz için oturumunuz kapatılıyor.", {
        duration: 5000,
        icon: '⚠️',
      })
      setTimeout(() => {
        signOut({ callbackUrl: '/auth/signin' })
      }, 3000)
    }
  }, [session])

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
