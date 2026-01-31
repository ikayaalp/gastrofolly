import { Metadata } from "next"
import SignInClient from "./SignInClient"

export const metadata: Metadata = {
  title: "Giriş Yap - Culinora",
  description: "Culinora hesabınıza giriş yapın ve gastronomi eğitimlerinize kaldığınız yerden devam edin.",
}

export default function SignInPage() {
  return <SignInClient />
}
