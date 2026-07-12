import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { REVENUE_TRACKING_START, HISTORICAL_REVENUE_OFFSET } from "@/lib/revenueConfig"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = searchParams.get("search") || ""
    const roleFilter = searchParams.get("role") || "ALL"
    const subFilter = searchParams.get("subFilter") || "ALL"

    const now = new Date()

    // 1. GLOBAL İSTATİSTİKLER (Filtreden Bağımsız, tüm kayıtlı kullanıcılar için)
    const baseGlobalWhere = { emailVerified: { not: null } }
    
    const [totalUsersCount, premiumUsersCount, activeSubscribersCount, iyzicoPayments] = await Promise.all([
      prisma.user.count({ where: baseGlobalWhere }),
      prisma.user.count({ where: { ...baseGlobalWhere, subscriptionPlan: { not: null } } }),
      prisma.user.count({ where: { ...baseGlobalWhere, subscriptionEndDate: { gt: now } } }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          subscriptionPlan: { not: null },
          createdAt: { gte: REVENUE_TRACKING_START }
        },
        _sum: { amount: true }
      })
    ])

    const totalRevenue = HISTORICAL_REVENUE_OFFSET + (iyzicoPayments._sum.amount || 0)

    // 2. FİLTRELİ LİSTELEME
    let whereClause: any = { emailVerified: { not: null } }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    }

    if (roleFilter !== "ALL") {
      whereClause.role = roleFilter
    }

    if (subFilter === "ACTIVE") {
      whereClause.subscriptionEndDate = { gt: now }
    }

    const [users, totalFiltered] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true, currency: true }
          },
          _count: {
            select: { createdCourses: true, enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        pages: Math.ceil(totalFiltered / limit)
      },
      stats: {
        totalUsers: totalUsersCount,
        premiumUsers: premiumUsersCount,
        activeSubscribers: activeSubscribersCount,
        totalRevenue
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
