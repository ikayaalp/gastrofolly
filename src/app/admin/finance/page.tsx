import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import FinanceClient from "./FinanceClient"

export default async function FinancePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  return <FinanceClient />
}
