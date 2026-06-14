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
    
    let whereClause = {}
    
    if (monthStr) {
      const startDate = new Date(`${monthStr}-01T00:00:00.000Z`)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      
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
        date: new Date(date)
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("[FINANCE_POST]", error)
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
