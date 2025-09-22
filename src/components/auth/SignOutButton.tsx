"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export default function SignOutButton() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center text-gray-300 hover:text-orange-500 transition-colors"
      title="Çıkış Yap"
    >
      <LogOut className="h-4 w-4" />
    </button>
  )
}
