import { NextRequest, NextResponse } from "next/server"
import { retrieveCheckoutForm } from "@/lib/iyzico"
import { prisma } from "@/lib/prisma"

/**
 * Iyzico ödeme callback endpoint
 * Ödeme tamamlandığında Iyzico bu endpoint'e yönlendirir
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const token = formData.get('token') as string

    if (!token) {
      return NextResponse.redirect(new URL('/cart?error=no_token', process.env.NEXTAUTH_URL!))
    }

    // Ödeme sonucunu Iyzico'dan al
    const result = await retrieveCheckoutForm(token)

    console.log('Iyzico callback result:', result)

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const conversationId = result.conversationId
      
      // Bu conversationId ile ilişkili tüm pending payment kayıtlarını bul
      const payments = await prisma.payment.findMany({
        where: {
          stripePaymentId: conversationId,
          status: 'PENDING'
        }
      })

      if (payments.length === 0) {
        console.error('Payment records not found:', conversationId)
        return NextResponse.redirect(new URL('/cart?error=payment_not_found', process.env.NEXTAUTH_URL!))
      }

      // conversationId formatı: userId_timestamp
      const userId = conversationId.split('_')[0]

      // Tüm ödeme kayıtlarını güncelle ve enrollment oluştur
      const courseIds = []
      for (const payment of payments) {
        // Payment kaydını güncelle
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            stripePaymentId: result.paymentId || conversationId,
          }
        })

        // Enrollment kontrolü ve oluşturma
        const existingEnrollment = await prisma.enrollment.findFirst({
          where: {
            userId: userId,
            courseId: payment.courseId
          }
        })

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              userId: userId,
              courseId: payment.courseId,
            }
          })
        }
        
        courseIds.push(payment.courseId)
      }

      console.log(`User ${userId} successfully enrolled in courses:`, courseIds)

      // Başarılı ödeme sonrası ilk kursa yönlendir
      return NextResponse.redirect(
        new URL(`/learn/${courseIds[0]}?success=true`, process.env.NEXTAUTH_URL!)
      )
    } else {
      // Ödeme başarısız
      console.error('Payment failed:', result)
      return NextResponse.redirect(
        new URL(`/cart?error=${result.errorMessage || 'payment_failed'}`, process.env.NEXTAUTH_URL!)
      )
    }
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/cart?error=callback_error', process.env.NEXTAUTH_URL!)
    )
  }
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/cart?error=no_token', process.env.NEXTAUTH_URL!))
  }

  try {
    const result = await retrieveCheckoutForm(token)
    
    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const conversationId = result.conversationId
      
      const payments = await prisma.payment.findMany({
        where: {
          stripePaymentId: conversationId,
          status: 'PENDING'
        }
      })

      if (payments.length === 0) {
        return NextResponse.redirect(new URL('/cart?error=payment_not_found', process.env.NEXTAUTH_URL!))
      }

      const userId = conversationId.split('_')[0]
      const courseIds = []

      for (const payment of payments) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            stripePaymentId: result.paymentId || conversationId,
          }
        })

        const existingEnrollment = await prisma.enrollment.findFirst({
          where: {
            userId: userId,
            courseId: payment.courseId
          }
        })

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              userId: userId,
              courseId: payment.courseId,
            }
          })
        }
        
        courseIds.push(payment.courseId)
      }

      return NextResponse.redirect(
        new URL(`/learn/${courseIds[0]}?success=true`, process.env.NEXTAUTH_URL!)
      )
    } else {
      return NextResponse.redirect(
        new URL(`/cart?error=${result.errorMessage || 'payment_failed'}`, process.env.NEXTAUTH_URL!)
      )
    }
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/cart?error=callback_error', process.env.NEXTAUTH_URL!)
    )
  }
}

