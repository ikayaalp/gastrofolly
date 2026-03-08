import { Metadata } from "next"
import VerifyEmailClient from "./VerifyEmailClient"

export const metadata: Metadata = {
    title: "E-posta Doğrula - Culinora",
    description: "Culinora hesabınızı doğrulamak için e-postanıza gelen kodu girin.",
}

export default function VerifyEmailPage() {
    return <VerifyEmailClient />
}
