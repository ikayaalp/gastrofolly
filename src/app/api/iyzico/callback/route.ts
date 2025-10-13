import { NextRequest, NextResponse } from "next/server"
import { retrieveCheckoutForm } from "@/lib/iyzico"
import { prisma } from "@/lib/prisma"

/**
 * Son pending payment'ları kontrol eder (parametre yoksa)
 */
async function handleRecentPayment() {
  try {
    // Son 5 dakikadaki pending payment'ları bul
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const recentPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: fiveMinutesAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })

    if (recentPayments.length === 0) {
      console.error('No recent pending payments found')
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Redirecting...</title>
          </head>
          <body>
            <script>
              window.location.href = '/cart?error=no_recent_payment';
            </script>
            <noscript>
              <meta http-equiv="refresh" content="0; url=/cart?error=no_recent_payment">
            </noscript>
          </body>
        </html>
      `
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const payment = recentPayments[0]
    console.log('Found recent payment:', payment)

    // UserId'yi payment kayıtlarından al
    const userId = payment.userId

    // Payment kaydını güncelle ve enrollment oluştur
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        stripePaymentId: payment.stripePaymentId,
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

    console.log(`User ${userId} successfully enrolled in course ${payment.courseId} via recent payment`)

    // Kurslarım sayfasına client-side yönlendirme
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <script>
            window.location.href = '/my-courses';
          </script>
          <noscript>
            <meta http-equiv="refresh" content="0; url=/my-courses">
          </noscript>
        </body>
      </html>
    `
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('handleRecentPayment error:', error)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <script>
            window.location.href = '/cart?error=recent_payment_error';
          </script>
          <noscript>
            <meta http-equiv="refresh" content="0; url=/cart?error=recent_payment_error">
          </noscript>
        </body>
      </html>
    `
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

/**
 * ConversationId ile ödeme kontrolü yapar
 */
async function handlePaymentWithConversationId(conversationId: string) {
  try {
    // Bu conversationId ile ilişkili tüm pending payment kayıtlarını bul
    let payments = await prisma.payment.findMany({
      where: {
        stripePaymentId: conversationId,
        status: 'PENDING'
      }
    })

    // Eğer bulunamadıysa, basketId formatında ara
    if (payments.length === 0) {
      console.log('ConversationId ile bulunamadı, basketId formatında arayalım')
      payments = await prisma.payment.findMany({
        where: {
          stripePaymentId: { contains: conversationId },
          status: 'PENDING'
        }
      })
    }

    if (payments.length === 0) {
      console.error('Payment records not found for conversationId:', conversationId)
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Redirecting...</title>
          </head>
          <body>
            <script>
              window.location.href = '/cart?error=payment_not_found';
            </script>
            <noscript>
              <meta http-equiv="refresh" content="0; url=/cart?error=payment_not_found">
            </noscript>
          </body>
        </html>
      `
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // UserId'yi payment kayıtlarından al
    const userId = payments[0].userId

    // Tüm ödeme kayıtlarını güncelle ve enrollment oluştur
    const courseIds = []
    for (const payment of payments) {
      // Payment kaydını güncelle
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          stripePaymentId: conversationId,
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

    console.log(`User ${userId} successfully enrolled in courses via conversationId:`, courseIds)

    // Kurslarım sayfasına client-side yönlendirme
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <script>
            window.location.href = '/my-courses';
          </script>
          <noscript>
            <meta http-equiv="refresh" content="0; url=/my-courses">
          </noscript>
        </body>
      </html>
    `
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('handlePaymentWithConversationId error:', error)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <script>
            window.location.href = '/cart?error=conversationId_error';
          </script>
          <noscript>
            <meta http-equiv="refresh" content="0; url=/cart?error=conversationId_error">
          </noscript>
        </body>
      </html>
    `
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

/**
 * Iyzico ödeme callback endpoint
 * Ödeme tamamlandığında Iyzico bu endpoint'e yönlendirir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    // Debug: Tüm parametreleri logla
    console.log('Callback URL:', request.url)
    console.log('Search params:', Object.fromEntries(searchParams.entries()))
    console.log('Token found:', token)

    if (!token) {
      console.error('No token found in callback URL')
      // Token yoksa diğer parametreleri de kontrol et
      const conversationId = searchParams.get('conversationId')
      const status = searchParams.get('status')
      console.log('Alternative params - conversationId:', conversationId, 'status:', status)
      
      // Eğer hiç parametre yoksa, son pending payment'ı kontrol et
      if (!conversationId && !status) {
        console.log('No parameters found, checking recent pending payments')
        return await handleRecentPayment()
      }
      
      if (conversationId) {
        // ConversationId ile direkt ödeme kontrolü yap
        console.log('Using conversationId for payment verification:', conversationId)
        return await handlePaymentWithConversationId(conversationId)
      }
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Redirecting...</title>
          </head>
          <body>
            <script>
              window.location.href = '/cart?error=payment_token_missing';
            </script>
            <noscript>
              <meta http-equiv="refresh" content="0; url=/cart?error=payment_token_missing">
            </noscript>
          </body>
        </html>
      `
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
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
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Redirecting...</title>
            </head>
            <body>
              <script>
                window.location.href = '/cart?error=payment_not_found';
              </script>
              <noscript>
                <meta http-equiv="refresh" content="0; url=/cart?error=payment_not_found">
              </noscript>
            </body>
          </html>
        `
        return new NextResponse(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        })
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

      // Başarılı ödeme sonrası kurslarım sayfasına client-side yönlendirme
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Redirecting...</title>
          </head>
          <body>
            <script>
              window.location.href = '/my-courses';
            </script>
            <noscript>
              <meta http-equiv="refresh" content="0; url=/my-courses">
            </noscript>
          </body>
        </html>
      `
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
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
          
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Redirecting...</title>
              </head>
              <body>
                <script>
                  window.location.href = '/cart?error=${encodeURIComponent(userFriendlyError)}';
                </script>
                <noscript>
                  <meta http-equiv="refresh" content="0; url=/cart?error=${encodeURIComponent(userFriendlyError)}">
                </noscript>
              </body>
            </html>
          `
          return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          })
        }
  } catch (error) {
    console.error('Callback error:', error)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <script>
            window.location.href = '/cart?error=callback_error';
          </script>
          <noscript>
            <meta http-equiv="refresh" content="0; url=/cart?error=callback_error">
          </noscript>
        </body>
      </html>
    `
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

/**
 * POST endpoint - İyzico bazen POST request de gönderebilir
 */
export async function POST(request: NextRequest) {
  // GET fonksiyonu ile aynı işlemi yap
  return GET(request)
}