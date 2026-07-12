import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const monthStr = searchParams.get("month") // format: YYYY-MM
    const yearStr = searchParams.get("year") // format: YYYY

    // Eğer year parametresi geldiyse, o yılın aylık özetini dön
    if (yearStr) {
      const year = parseInt(yearStr, 10)
      const startDate = new Date(Date.UTC(year, 0, 1))
      const endDate = new Date(Date.UTC(year + 1, 0, 1))

      const records = await prisma.financeRecord.findMany({
        where: {
          date: {
            gte: startDate,
            lt: endDate
          }
        },
        select: {
          type: true,
          amount: true,
          date: true
        }
      })

      // 12 aylık sıfırlanmış veri yapısı oluştur
      const monthlySummary = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        income: 0,
        expense: 0
      }))

      // Verileri aylara göre topla
      for (const record of records) {
        const d = new Date(record.date)
        const monthIndex = d.getUTCMonth() // 0-11
        if (record.type === 'INCOME') {
          monthlySummary[monthIndex].income += record.amount
        } else {
          monthlySummary[monthIndex].expense += record.amount
        }
      }

      return NextResponse.json(monthlySummary)
    }

    // Yıllık değilse, mevcut aylık sorgu (veya tümü) çalışsın
    let whereClause = {}
    
    if (monthStr) {
      // YYYY-MM şeklindeki formattan doğru parse etmek için
      const [y, m] = monthStr.split('-').map(Number)
      const startDate = new Date(Date.UTC(y, m - 1, 1))
      const endDate = new Date(Date.UTC(y, m, 1))
      
      whereClause = {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    }

    const records = await prisma.financeRecord.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("[FINANCE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { type, amount, title, description, category, documentUrl, date } = body

    if (!type || !amount || !title || !date) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const record = await prisma.financeRecord.create({
      data: {
        type,
        amount: parseFloat(amount),
        title,
        description,
        category,
        documentUrl,
        date: new Date(date),
        createdById: session.user.id
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("[FINANCE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { id, type, amount, title, description, category, documentUrl, date } = body

    if (!id || !type || amount == null || !title || !date) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const record = await prisma.financeRecord.update({
      where: { id },
      data: {
        type,
        amount: parseFloat(amount),
        title,
        description,
        category,
        documentUrl,
        date: new Date(date),
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("[FINANCE_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return new NextResponse("Missing id", { status: 400 })
    }

    const record = await prisma.financeRecord.delete({
      where: {
        id
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("[FINANCE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
