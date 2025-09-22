import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    // Kursu veritabanından al
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        category: true,
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    // Kullanıcının bu kursa zaten kayıtlı olup olmadığını kontrol et
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this course" },
        { status: 400 }
      )
    }

    // Ödenecek fiyatı belirle (indirimli fiyat varsa onu kullan)
    const finalPrice = course.discountedPrice || course.price

    // Stripe checkout session oluştur
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'try',
            product_data: {
              name: course.title,
              description: course.description,
              images: course.imageUrl ? [course.imageUrl] : [],
            },
            unit_amount: Math.round(finalPrice * 100), // Stripe kuruş cinsinden bekliyor
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/course/${courseId}?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/course/${courseId}?canceled=true`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
        courseId: courseId,
      },
    })

    // Payment kaydı oluştur
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        amount: finalPrice,
        currency: 'TRY',
        status: 'PENDING',
        stripePaymentId: checkoutSession.id,
      }
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

