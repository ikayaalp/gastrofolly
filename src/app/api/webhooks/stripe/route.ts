import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { claimWebhookEvent } from "@/lib/webhookIdempotency"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    // Stripe ayni event'i birden fazla kez teslim edebilir (retry). event.id
    // her olay icin sabit ve benzersizdir -> ikinci teslimatta islem atlanir.
    const isNewEvent = await claimWebhookEvent("stripe", event.id)
    if (!isNewEvent) {
      console.log(`[Stripe Webhook] Duplicate event ignored: ${event.id}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.metadata?.userId && session.metadata?.courseIds) {
          const courseIds = JSON.parse(session.metadata.courseIds)
          const userId = session.metadata.userId

          // Payment guncelleme + tum enrollment'lar tek transaction'da:
          // biri basarisiz olursa hicbiri uygulanmaz (odeme COMPLETED olup
          // erisimin acilmamasi gibi tutarsiz bir durum olusmaz).
          await prisma.$transaction(async (tx) => {
            await tx.payment.updateMany({
              where: {
                stripePaymentId: session.id,
                status: 'PENDING'
              },
              data: {
                status: 'COMPLETED',
                platform: 'STRIPE'
              }
            })

            for (const courseId of courseIds) {
              await tx.enrollment.create({
                data: { userId, courseId }
              })
            }
          })

          console.log(`User ${userId} enrolled in courses: ${courseIds.join(', ')}`)
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        
        if (failedPayment.metadata?.userId && failedPayment.metadata?.courseId) {
          // Payment durumunu güncelle
          await prisma.payment.updateMany({
            where: {
              userId: failedPayment.metadata.userId,
              courseId: failedPayment.metadata.courseId,
              status: 'PENDING'
            },
            data: {
              status: 'FAILED'
            }
          })
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

