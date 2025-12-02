import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * İyzico ödeme tamamlama endpoint'i
 * Ödeme başarılı olduğunda pending payment'ları COMPLETED yapar ve enrollment oluşturur
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: "ConversationId is required" },
        { status: 400 }
      )
    }

    console.log('Complete payment request for conversationId:', conversationId)

    // Bu conversationId ile ilişkili pending payment'ları bul
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        stripePaymentId: { contains: conversationId },
        status: 'PENDING'
      }
    })

    if (payments.length === 0) {
      console.error('No pending payments found for conversationId:', conversationId)
      return NextResponse.json(
        { error: "No pending payments found" },
        { status: 404 }
      )
    }

    console.log(`Found ${payments.length} pending payment(s)`)

    // Tüm payment'ları COMPLETED yap ve enrollment oluştur
    const courseIds = []
    for (const payment of payments) {
      // Payment kaydını güncelle
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          stripePaymentId: payment.stripePaymentId,
        }
      })

      // Enrollment kontrolü ve oluşturma (sadece kurs ödemeleri için)
      if (payment.courseId) {
        const existingEnrollment = await prisma.enrollment.findFirst({
          where: {
            userId: session.user.id,
            courseId: payment.courseId
          }
        })

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              userId: session.user.id,
              courseId: payment.courseId,
            }
          })
        }

        courseIds.push(payment.courseId)
      }
    }

    console.log(`✅ SUCCESSFUL PAYMENT: User ${session.user.id} enrolled in courses:`, courseIds)

    return NextResponse.json({
      success: true,
      message: "Ödeme başarılı! Kurslarınız hesabınıza eklendi.",
      courses: courseIds
    })
  } catch (error) {
    console.error('Complete payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

