import { NextRequest, NextResponse } from "next/server"
import { retrieveCheckoutForm } from "@/lib/iyzico"
import { prisma } from "@/lib/prisma"
import { sendSubscriptionStartedEmail } from "@/lib/emailService"

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
                      window.location.href = '/checkout?error=payment_not_found';
                    </script>
                    <noscript>
                      <meta http-equiv="refresh" content="0; url=/checkout?error=payment_not_found">
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

              // Abonelik güncelleme
              if (payment.subscriptionPlan) {
                const now = new Date()
                let endDate = new Date(now)

                // Ödeme dönemine göre süre ekle
                if (payment.billingPeriod === 'yearly') {
                  endDate.setFullYear(endDate.getFullYear() + 1)
                } else if (payment.billingPeriod === '6monthly') {
                  endDate.setMonth(endDate.getMonth() + 6)
                } else {
                  endDate.setMonth(endDate.getMonth() + 1)
                }

                const user = await prisma.user.update({
                  where: { id: userId },
                  data: {
                    subscriptionPlan: payment.subscriptionPlan,
                    subscriptionStartDate: new Date(),
                    subscriptionEndDate: endDate
                  }
                })
                console.log(`✅ Subscription updated for user ${userId}: ${payment.subscriptionPlan}`)

                // Hoşgeldin emaili gönder
                if (user.email) {
                  await sendSubscriptionStartedEmail(
                    user.email,
                    user.name || 'Chef',
                    payment.subscriptionPlan,
                    endDate
                  )
                }
              }

              // Enrollment oluşturma (sadece kurs ödemeleri için)
              if (payment.courseId) {
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
                    window.location.href = '/checkout?error=${encodeURIComponent(userFriendlyError)}';
                  </script>
                  <noscript>
                    <meta http-equiv="refresh" content="0; url=/checkout?error=${encodeURIComponent(userFriendlyError)}">
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
                  window.location.href = '/checkout?error=payment_not_found';
                </script>
                <noscript>
                  <meta http-equiv="refresh" content="0; url=/checkout?error=payment_not_found">
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

          // Abonelik güncelleme
          if (payment.subscriptionPlan) {
            const now = new Date()
            let endDate = new Date(now)

            if (payment.billingPeriod === 'yearly') {
              endDate.setFullYear(endDate.getFullYear() + 1)
            } else if (payment.billingPeriod === '6monthly') {
              endDate.setMonth(endDate.getMonth() + 6)
            } else {
              endDate.setMonth(endDate.getMonth() + 1)
            }

            const user = await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionPlan: payment.subscriptionPlan,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: endDate
              }
            })
            console.log(`✅ Subscription updated for user ${userId}: ${payment.subscriptionPlan}`)

            // Hoşgeldin emaili gönder
            if (user.email) {
              await sendSubscriptionStartedEmail(
                user.email,
                user.name || 'Chef',
                payment.subscriptionPlan,
                endDate
              )
            }
          }

          // Enrollment oluşturma (sadece kurs ödemeleri için)
          if (payment.courseId) {
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
              window.location.href = '/checkout?error=payment_token_missing';
            </script>
            <noscript>
              <meta http-equiv="refresh" content="0; url=/checkout?error=payment_token_missing">
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
                window.location.href = '/checkout?error=payment_not_found';
              </script>
              <noscript>
                <meta http-equiv="refresh" content="0; url=/checkout?error=payment_not_found">
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

        // Abonelik güncelleme
        if (payment.subscriptionPlan) {
          const now = new Date()
          let endDate = new Date(now)

          // Ödeme dönemine göre süre ekle
          if (payment.billingPeriod === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1)
          } else if (payment.billingPeriod === '6monthly') {
            endDate.setMonth(endDate.getMonth() + 6)
          } else {
            endDate.setMonth(endDate.getMonth() + 1) // Default Aylık
          }

          const user = await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionPlan: payment.subscriptionPlan,
              subscriptionStartDate: new Date(),
              subscriptionEndDate: endDate
            }
          })
          console.log(`✅ Subscription updated for user ${userId}: ${payment.subscriptionPlan} (Until: ${endDate.toISOString()})`)

          // Hoşgeldin emaili gönder
          if (user.email) {
            await sendSubscriptionStartedEmail(
              user.email,
              user.name || 'Chef',
              payment.subscriptionPlan,
              endDate
            )
          }
        }

        // Enrollment kontrolü ve oluşturma (sadece kurs ödemeleri için)
        if (payment.courseId) {
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
              window.location.href = '/checkout?error=${encodeURIComponent(userFriendlyError)}';
            </script>
            <noscript>
              <meta http-equiv="refresh" content="0; url=/checkout?error=${encodeURIComponent(userFriendlyError)}">
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
            window.location.href = '/checkout?error=callback_error';
          </script>
          <noscript>
            <meta http-equiv="refresh" content="0; url=/checkout?error=callback_error">
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
 * POST endpoint - İyzico ödeme sonrası callback
 * İyzico token'ı POST body'de gönderir (form-encoded veya JSON)
 */
export async function POST(request: NextRequest) {
  try {
    let token: string | null = null

    // 1. URL query params'dan token'ı dene
    const { searchParams } = new URL(request.url)
    token = searchParams.get('token')

    // 2. POST body'den token'ı çıkar (iyzico genelde burada gönderir)
    if (!token) {
      try {
        const contentType = request.headers.get('content-type') || ''

        if (contentType.includes('application/x-www-form-urlencoded')) {
          // Form-encoded body
          const formData = await request.formData()
          token = formData.get('token') as string | null
          console.log('Token from form-data:', token)
        } else if (contentType.includes('application/json')) {
          // JSON body
          const body = await request.json()
          token = body.token || null
          console.log('Token from JSON body:', token)
        } else {
          // Body'yi text olarak oku ve parse etmeyi dene
          const bodyText = await request.text()
          console.log('Raw POST body:', bodyText.substring(0, 500))

          // URL-encoded format: token=xxx&...
          if (bodyText.includes('token=')) {
            const params = new URLSearchParams(bodyText)
            token = params.get('token')
            console.log('Token from raw body parse:', token)
          }

          // JSON format
          if (!token && bodyText.startsWith('{')) {
            try {
              const parsed = JSON.parse(bodyText)
              token = parsed.token || null
              console.log('Token from raw JSON parse:', token)
            } catch (e) {
              // Not JSON
            }
          }
        }
      } catch (e) {
        console.error('Error parsing POST body for token:', e)
      }
    }

    console.log('POST Callback - Final token:', token)
    console.log('POST Callback - URL:', request.url)
    console.log('POST Callback - Content-Type:', request.headers.get('content-type'))

    if (!token) {
      console.error('❌ No token found in POST callback (neither URL params nor body)')

      // Son çare: En son oluşturulan pending payment'ın token'ını kullan
      const lastPendingPayment = await prisma.payment.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
      })

      if (lastPendingPayment?.stripePaymentId) {
        console.log('Falling back to last pending payment token:', lastPendingPayment.stripePaymentId)
        token = lastPendingPayment.stripePaymentId
      } else {
        const html = `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><title>Redirecting...</title></head>
            <body>
              <script>window.location.href = '/checkout?error=payment_token_missing';</script>
              <noscript><meta http-equiv="refresh" content="0; url=/checkout?error=payment_token_missing"></noscript>
            </body>
          </html>
        `
        return new NextResponse(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        })
      }
    }

    // Token ile ödeme sonucunu İyzico'dan al
    const result = await retrieveCheckoutForm(token)

    console.log('Iyzico POST callback result:', {
      status: result.status,
      paymentStatus: result.paymentStatus,
      conversationId: result.conversationId,
      paymentId: result.paymentId,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage
    })

    // BAŞARILI ÖDEME
    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const conversationId = result.conversationId

      // Payment kayıtlarını bul
      let payments = await prisma.payment.findMany({
        where: {
          OR: [
            { id: conversationId, status: 'PENDING' },
            { stripePaymentId: token, status: 'PENDING' },
            { stripePaymentId: conversationId, status: 'PENDING' }
          ]
        }
      })

      // basketId ile de dene
      if (payments.length === 0 && result.basketId) {
        const basketPaymentId = result.basketId.replace('BASKET_', '')
        payments = await prisma.payment.findMany({
          where: {
            OR: [
              { id: basketPaymentId, status: 'PENDING' },
              { stripePaymentId: result.basketId, status: 'PENDING' }
            ]
          }
        })
      }

      if (payments.length === 0) {
        console.error('Payment records not found for conversationId:', conversationId)
        const html = `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><title>Redirecting...</title></head>
            <body>
              <script>window.location.href = '/checkout?error=payment_not_found';</script>
              <noscript><meta http-equiv="refresh" content="0; url=/checkout?error=payment_not_found"></noscript>
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
            stripePaymentId: result.paymentId || token,
          }
        })

        // Abonelik güncelleme
        if (payment.subscriptionPlan) {
          const now = new Date()
          let endDate = new Date(now)

          if (payment.billingPeriod === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1)
          } else if (payment.billingPeriod === '6monthly') {
            endDate.setMonth(endDate.getMonth() + 6)
          } else {
            endDate.setMonth(endDate.getMonth() + 1)
          }

          const user = await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionPlan: payment.subscriptionPlan,
              subscriptionStartDate: new Date(),
              subscriptionEndDate: endDate
            }
          })
          console.log(`✅ Subscription updated: ${userId} -> ${payment.subscriptionPlan} until ${endDate.toISOString()}`)

          // Hoşgeldin emaili gönder
          if (user.email) {
            await sendSubscriptionStartedEmail(
              user.email,
              user.name || 'Chef',
              payment.subscriptionPlan,
              endDate
            )
          }
        }

        // Enrollment oluştur
        if (payment.courseId) {
          const existing = await prisma.enrollment.findFirst({
            where: { userId, courseId: payment.courseId }
          })
          if (!existing) {
            await prisma.enrollment.create({
              data: { userId, courseId: payment.courseId }
            })
          }
        }
      }

      console.log(`✅ SUCCESSFUL PAYMENT (POST): User ${userId}`)

      const html = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><title>Redirecting...</title></head>
          <body>
            <script>window.location.href = '/my-courses';</script>
            <noscript><meta http-equiv="refresh" content="0; url=/my-courses"></noscript>
          </body>
        </html>
      `
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
    } else {
      // BAŞARISIZ ÖDEME
      console.error('❌ FAILED PAYMENT (POST):', {
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage
      })

      let userFriendlyError = result.errorMessage || 'payment_failed'

      const html = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><title>Redirecting...</title></head>
          <body>
            <script>window.location.href = '/checkout?error=${encodeURIComponent(userFriendlyError)}';</script>
            <noscript><meta http-equiv="refresh" content="0; url=/checkout?error=${encodeURIComponent(userFriendlyError)}"></noscript>
          </body>
        </html>
      `
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
    }
  } catch (error) {
    console.error('❌ POST Callback error:', error)
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Redirecting...</title></head>
        <body>
          <script>window.location.href = '/checkout?error=callback_error';</script>
          <noscript><meta http-equiv="refresh" content="0; url=/checkout?error=callback_error"></noscript>
        </body>
      </html>
    `
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
