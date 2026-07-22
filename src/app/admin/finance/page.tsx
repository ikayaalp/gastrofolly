import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { calculateNetRevenue } from "@/lib/revenueConfig"
import FinanceClient from "./FinanceClient"

export default async function FinancePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  // Tüm zamanlar abonelik geliri (Payment) — brüt ve komisyon sonrası net.
  // FinanceRecord'dan bağımsız; bilgi amaçlı özet olarak gösterilir.
  const payments = await prisma.payment.findMany({
    where: { status: 'COMPLETED', subscriptionPlan: { not: null } },
    select: { amount: true, platform: true },
  })
  let subGross = 0
  let subNet = 0
  for (const p of payments) {
    subGross += p.amount
    subNet += calculateNetRevenue(p.amount, p.platform)
  }

  return (
    <FinanceClient
      subGross={Math.round(subGross * 100) / 100}
      subNet={Math.round(subNet * 100) / 100}
    />
  )
}
