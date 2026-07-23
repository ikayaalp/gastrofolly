import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import SignInClient from "./SignInClient"

export const metadata: Metadata = {
  title: "Giriş Yap - Culinora",
  description: "Culinora hesabınıza giriş yapın ve gastronomi eğitimlerinize kaldığınız yerden devam edin.",
}

export default async function SignInPage() {
  // Devralınmış oturum (başka cihazdan giriş): kimliği sökülmüş session'la
  // buraya düşen kullanıcıyı signin formu hiç render edilmeden, sunucu
  // tarafında doğrudan profil seçimine gönder. (Server sayfaları id
  // göremeyince signin'e redirect eder; bu sayfa zinciri profiles'a bağlar —
  // kullanıcı arada "Giriş Yap" ekranını hiç görmez.)
  const session = await getServerSession(authOptions)
  if ((session as { error?: string } | null)?.error === "ConcurrentLogin") {
    redirect("/auth/profiles")
  }

  return <SignInClient />
}
