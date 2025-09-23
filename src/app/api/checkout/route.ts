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

    // Stripe checkout session oluştur
    const lineItems = items.map((item: CartItem) => ({
      price_data: {
        currency: 'try',
        product_data: {
          name: item.title,
          description: `Eğitmen: ${item.instructor.name}`,
          images: item.imageUrl ? [item.imageUrl] : [],
        },
        unit_amount: Math.round((item.discountedPrice || item.price) * 100),
      },
      quantity: 1,
    }))

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/my-courses?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart?canceled=true`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
        courseIds: JSON.stringify(courseIds),
        total: total.toString(),
      },
    })

    // Payment kayıtları oluştur
    for (const item of items) {
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          courseId: item.id,
          amount: item.discountedPrice || item.price,
          currency: 'TRY',
          status: 'PENDING',
          stripePaymentId: checkoutSession.id,
        }
      })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

