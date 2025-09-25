import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

interface CartItem {
  id: string
  title: string
  price: number
  discountedPrice?: number
  imageUrl?: string
  instructor: {
    name: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { items, total } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart items are required" },
        { status: 400 }
      )
    }

    // Kullanıcının bu kurslara zaten kayıtlı olup olmadığını kontrol et
    const courseIds = items.map((item: CartItem) => item.id)
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        courseId: { in: courseIds }
      }
    })

    if (existingEnrollments.length > 0) {
      return NextResponse.json(
        { error: "You are already enrolled in some of these courses" },
        { status: 400 }
      )
    }

    // Şimdilik direkt kurs kaydı yap (Stripe olmadan)
    const enrollments = []
    const payments = []

    for (const item of items) {
      // Kurs kaydı oluştur
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: session.user.id,
          courseId: item.id,
        }
      })
      enrollments.push(enrollment)

      // Payment kaydı oluştur (COMPLETED olarak)
      const payment = await prisma.payment.create({
        data: {
          userId: session.user.id,
          courseId: item.id,
          amount: item.discountedPrice || item.price,
          currency: 'TRY',
          status: 'COMPLETED',
          stripePaymentId: `direct_${Date.now()}_${item.id}`,
        }
      })
      payments.push(payment)
    }

    console.log(`User ${session.user.id} enrolled in courses: ${courseIds.join(', ')}`)

    return NextResponse.json({ 
      success: true, 
      message: "Kurslar başarıyla satın alındı!",
      enrollments: enrollments.length,
      redirectUrl: "/my-courses?success=true"
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

