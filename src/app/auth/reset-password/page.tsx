import { Metadata } from "next"
import ResetPasswordClient from "./ResetPasswordClient"

export const metadata: Metadata = {
  title: "Şifremi Sıfırla - Culinora",
  description: "Culinora hesabınızın şifresini güvenle sıfırlayın.",
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
