import { Metadata } from "next"
import SignUpClient from "./SignUpClient"

export const metadata: Metadata = {
  title: "Hesap Oluştur - Culinora",
  description: "Culinora'ya üye olun ve profesyonel şeflerden sertifikalı gastronomi eğitimlerine başlayın.",
}

export default function SignUpPage() {
  return <SignUpClient />
}
