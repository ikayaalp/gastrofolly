import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import UserManagement from "./UserManagement"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Kullanıcıları getir
  const users = await prisma.user.findMany({
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
          enrollments: true,
          reviews: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Toplam Gelir: 85 TL sabit + 21 Şubat sonrası gerçek Iyzico ödemeleri
  const iyzicoPayments = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      subscriptionPlan: { not: null },
      createdAt: { gte: new Date('2026-02-21T00:00:00.000Z') }
    },
    _sum: { amount: true }
  })
  const totalRevenue = 85 + (iyzicoPayments._sum.amount || 0)

  return <UserManagement users={users} totalRevenue={totalRevenue} />
}
