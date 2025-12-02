import { NextRequest, NextResponse } from "next/server"
import { retrieveCheckoutForm } from "@/lib/iyzico"
import { prisma } from "@/lib/prisma"

/**
 * Iyzico ödeme callback endpoint
 * Ödeme tamamlandığında Iyzico bu endpoint'e yönlendirir
 * Token ile İyzico'dan ödeme sonucunu kontrol eder
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const conversationIdParam = searchParams.get('conversationId')

    // Debug: Tüm parametreleri ve headers'ları logla
    console.log('Callback URL:', request.url)
    console.log('Search params:', Object.fromEntries(searchParams.entries()))
    console.log('Headers:', {
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin'),
      'user-agent': request.headers.get('user-agent')
    })
    console.log('Token found:', token)
    console.log('ConversationId param:', conversationIdParam)

    // Token yoksa, POST body'de olabilir mi kontrol et
    if (!token) {
      console.error('No token found in callback URL')

      // Referer'dan token'ı çıkarmayı dene
      const referer = request.headers.get('referer')
      if (referer) {
        console.log('Referer URL:', referer)
        const refererUrl = new URL(referer)
        const refererToken = refererUrl.searchParams.get('token')
        if (refererToken) {
          console.log('Token found in referer:', refererToken)
          // Token'ı referer'dan al ve tekrar işle
          searchParams.set('token', refererToken)
          const result = await retrieveCheckoutForm(refererToken)

          console.log('Iyzico callback result (from referer):', result)

          // Aynı success/fail kontrolünü yap
          if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
            // Başarılı ödeme akışı (aşağıdaki kodla aynı)
            const conversationId = result.conversationId

            let payments = await prisma.payment.findMany({
              where: {
                stripePaymentId: conversationId,
                status: 'PENDING'
              }
            })

            if (payments.length === 0 && result.basketId) {
              payments = await prisma.payment.findMany({
                where: {
                  stripePaymentId: result.basketId,
                  status: 'PENDING'
                }
              })
            }

            if (payments.length === 0) {
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

            const userId = payments[0].userId

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
            }

            console.log(`✅ SUCCESSFUL PAYMENT (from referer): User ${userId} enrolled`)

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
            // Başarısız ödeme
            let userFriendlyError = 'payment_failed'
            if (result.errorMessage) {
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
        }
      }

      // ConversationId parametresi varsa pending payment'ları başarılı kabul et
      if (conversationIdParam) {
        console.log('No token but conversationId found, marking pending payments as completed')

        // Bu conversationId ile ilişkili pending payment'ları bul
        const payments = await prisma.payment.findMany({
          where: {
            stripePaymentId: { contains: conversationIdParam },
            status: 'PENDING'
          }
        })

        if (payments.length === 0) {
          console.error('No pending payments found for conversationId:', conversationIdParam)
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

        const userId = payments[0].userId

        // Tüm payment'ları COMPLETED yap ve enrollment oluştur
        for (const payment of payments) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              stripePaymentId: payment.stripePaymentId,
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
        }

        console.log(`✅ SUCCESSFUL PAYMENT (via conversationId): User ${userId} enrolled`)

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
      }

      console.error('No token found in callback URL or referer - cannot verify payment status')
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

    // Token ile ödeme sonucunu İyzico'dan al
    const result = await retrieveCheckoutForm(token)

    console.log('Iyzico callback result:', result)

    // Debug: Tüm durumları logla
    console.log('Payment Status Check:', {
      status: result.status,
      paymentStatus: result.paymentStatus,
      fraudStatus: result.fraudStatus,
      shouldProceed: result.status === 'success' && result.paymentStatus === 'SUCCESS'
    })

    // BAŞARILI ÖDEME - Enrollment oluştur ve my-courses'a yönlendir
    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const conversationId = result.conversationId

      // Bu conversationId ile ilişkili tüm pending payment kayıtlarını bul
      let payments = await prisma.payment.findMany({
        where: {
          stripePaymentId: conversationId,
          status: 'PENDING'
        }
      })

      // Eğer bulunamadıysa, basketId ile de ara
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

      console.log(`✅ SUCCESSFUL PAYMENT: User ${userId} enrolled in courses:`, courseIds)

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
      // BAŞARISIZ ÖDEME - Sepete yönlendir
      console.error('❌ FAILED PAYMENT - İyzico Response:', {
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
    console.error('❌ Callback error:', error)
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
  return GET(request)
}
