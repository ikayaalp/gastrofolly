import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
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
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.metadata?.userId && session.metadata?.courseId) {
          // Payment durumunu güncelle
          await prisma.payment.updateMany({
            where: {
              stripePaymentId: session.id,
              status: 'PENDING'
            },
            data: {
              status: 'COMPLETED'
            }
          })

          // Kullanıcıyı kursa kaydet
          await prisma.enrollment.create({
            data: {
              userId: session.metadata.userId,
              courseId: session.metadata.courseId,
            }
          })

          console.log(`User ${session.metadata.userId} enrolled in course ${session.metadata.courseId}`)
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

