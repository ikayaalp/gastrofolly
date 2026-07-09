import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { REVENUE_TRACKING_START, HISTORICAL_REVENUE_OFFSET } from "@/lib/revenueConfig"
import UserManagement from "./UserManagement"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Kullanıcıları getir
  const users = await prisma.user.findMany({
    where: {
      emailVerified: { not: null }
    },
    include: {
      payments: {
        where: {
          status: 'COMPLETED'
        },
        select: {
          amount: true,
          currency: true
        }
      },
      _count: {
        select: {
          createdCourses: true,
          enrollments: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Toplam Gelir: Sabit + sonrası gerçek Iyzico ödemeleri
  const iyzicoPayments = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      subscriptionPlan: { not: null },
      createdAt: { gte: REVENUE_TRACKING_START }
    },
    _sum: { amount: true }
  })
  const totalRevenue = HISTORICAL_REVENUE_OFFSET + (iyzicoPayments._sum.amount || 0)

  return <UserManagement users={users} totalRevenue={totalRevenue} />
}
