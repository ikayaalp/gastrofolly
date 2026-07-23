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

    // Devralınmış oturumla profiles dışında hiçbir yerde durulamaz. signin'e
    // istisna YOK: kimliği sökülmüş session'la server sayfaları signin'e
    // redirect eder, kullanıcı orada takılı kalır (profiles'ı hiç görmez).
    // Farklı hesapla girişin meşru yolu profiles'taki buton — o önce signOut
    // yapar, session temizlenince bu sabitleme zaten devreden çıkar.
    if (pathname !== '/auth/profiles') {
      // Uyarı SADECE içeride gezerken canlı düşürülme anında gösterilir.
      // Dışarıdan gelen (siteyi açar açmaz profiles'a düşen) kullanıcıya
      // "oturum kapatılıyor" demek gereksiz panik yaratıyor — devralma
      // günler önce kendi başka cihazından da olmuş olabilir.
      if (!hasToasted.current) {
        hasToasted.current = true
        toast.error("Hesabınızda başka bir cihazda oturum açıldığı için bu oturum kapatılıyor. Devam etmek için profilinizi seçin.", {
          duration: 5000,
          icon: '⚠️',
        })
      }
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
