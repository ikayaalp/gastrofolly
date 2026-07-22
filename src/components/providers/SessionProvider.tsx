"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { useRouter, usePathname } from "next/navigation"

// ConcurrentLogin durumunda session callback kimliği söktüğü için (auth.ts)
// server sayfaları/API'ler zaten hiçbir şeye izin vermez; bu listener da
// kullanıcıyı client tarafında /auth/profiles'a SABİTLER — hangi sayfaya
// gitmeye çalışırsa çalışsın geri itilir. Ekrandan çıkışın iki yolu vardır:
// profili seçip oturumu geri almak ya da farklı hesapla giriş yapmak.
function SessionListener() {
  const { data: session } = useSession()
  const hasToasted = useRef(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if ((session as any)?.error !== 'ConcurrentLogin') return

    if (!hasToasted.current) {
      hasToasted.current = true
      toast.error("Başka bir cihazdan giriş yapıldı. Mevcut cihazdan devam etmek için profilinizi seçin.", {
        duration: 5000,
        icon: '⚠️',
      })
    }

    // Devralınmış oturumla profiles dışında hiçbir yerde durulamaz. signin'e
    // istisna YOK: kimliği sökülmüş session'la server sayfaları signin'e
    // redirect eder, kullanıcı orada takılı kalır (profiles'ı hiç görmez).
    // Farklı hesapla girişin meşru yolu profiles'taki buton — o önce signOut
    // yapar, session temizlenince bu sabitleme zaten devreden çıkar.
    if (pathname !== '/auth/profiles') {
      router.replace('/auth/profiles')
    }
  }, [session, pathname, router])

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
