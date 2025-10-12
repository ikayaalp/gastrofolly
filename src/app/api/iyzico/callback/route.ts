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

    // Debug: Tüm durumları logla
    console.log('Payment Status Check:', {
      status: result.status,
      paymentStatus: result.paymentStatus,
      fraudStatus: result.fraudStatus,
      shouldProceed: result.status === 'success' && result.paymentStatus === 'SUCCESS' && result.fraudStatus !== 1
    })

    // Ödeme başarılı ise (fraud detection'a rağmen)
    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const conversationId = result.conversationId
      
      // Bu conversationId ile ilişkili tüm pending payment kayıtlarını bul
      let payments = await prisma.payment.findMany({
        where: {
          stripePaymentId: conversationId,
          status: 'PENDING'
        }
      })

      // Eğer bulunamadıysa, basketId ile de ara (İyzico bazen conversationId'yi değiştirebiliyor)
      if (payments.length === 0 && result.basketId) {
        console.log('ConversationId ile bulunamadı, basketId ile arayalım:', result.basketId)
        payments = await prisma.payment.findMany({
          where: {
            stripePaymentId: result.basketId,
            status: 'PENDING'
          }
        })
      }

      if (payments.length === 0) {
        console.error('Payment records not found for conversationId:', conversationId, 'basketId:', result.basketId)
        // Debug için tüm pending payment'ları listele
        const allPendingPayments = await prisma.payment.findMany({
          where: { status: 'PENDING' },
          select: { stripePaymentId: true, userId: true, courseId: true, createdAt: true }
        })
        console.error('All pending payments:', allPendingPayments)
        return NextResponse.redirect(new URL('/cart?error=payment_not_found', process.env.NEXTAUTH_URL!))
      }

      // UserId'yi payment kayıtlarından al (conversationId formatı değişebiliyor)
      const userId = payments[0].userId

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

      // Fraud detection varsa özel mesajla kurs detay sayfasına yönlendir
      if (result.fraudStatus === 1) {
        console.log('Payment completed despite fraud detection')
        return NextResponse.redirect(
          new URL(`/course/${courseIds[0]}?success=true&fraud_bypassed=true`, process.env.NEXTAUTH_URL!)
        )
      }

      // Normal başarılı ödeme sonrası kurs detay sayfasına yönlendir
      return NextResponse.redirect(
        new URL(`/course/${courseIds[0]}?success=true`, process.env.NEXTAUTH_URL!)
      )
        } else {
          // Ödeme başarısız - detaylı log
          console.error('Payment failed - İyzico Response:', {
            status: result.status,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
            errorGroup: result.errorGroup,
            conversationId: result.conversationId,
            paymentId: result.paymentId,
            fraudStatus: result.fraudStatus
          })
          
          // Hata mesajını daha kullanıcı dostu hale getir
          let userFriendlyError = 'payment_failed'
          if (result.fraudStatus === 1) {
            userFriendlyError = 'Güvenlik kontrolü nedeniyle ödeme reddedildi. Lütfen farklı bir kart deneyin.'
          } else if (result.errorCode === '1000') {
            userFriendlyError = 'Geçersiz kart bilgileri'
          } else if (result.errorCode === '1001') {
            userFriendlyError = 'Kart bilgileri bulunamadı'
          } else if (result.errorCode === '1003') {
            userFriendlyError = 'Yetersiz bakiye'
          } else if (result.errorCode === '1004') {
            userFriendlyError = 'Kart kullanılamıyor'
          } else if (result.errorMessage) {
            userFriendlyError = result.errorMessage
          }
          
          return NextResponse.redirect(
            new URL(`/cart?error=${encodeURIComponent(userFriendlyError)}`, process.env.NEXTAUTH_URL!)
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

