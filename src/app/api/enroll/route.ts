import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      )
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: "Kurs ID'si gerekli" },
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
        { error: "Kurs bulunamadı" },
        { status: 404 }
      )
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: "Bu kurs henüz yayınlanmamış" },
        { status: 400 }
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
        { error: "Bu kursa zaten kayıtlısınız" },
        { status: 400 }
      )
    }

    // Kullanıcının aboneliği var mı kontrol et
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, subscriptionEndDate: true }
    })

    if (!course.isFree) {
      if (!user?.subscriptionPlan) {
        return NextResponse.json(
          { error: "Bu kursa kayıt olmak için aktif bir aboneliğiniz olmalıdır." },
          { status: 403 }
        )
      }

      // Abonelik süresi dolmuş mu kontrol et
      if (user.subscriptionEndDate && new Date() > user.subscriptionEndDate) {
        return NextResponse.json(
          { error: "Abonelik süreniz dolmuş. Lütfen aboneliğinizi yenileyin." },
          { status: 403 }
        )
      }
    }

    // Kullanıcıyı kursa kaydet
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
      }
    })

    // Not: Artık her kayıt için fake ödeme oluşturmuyoruz.
    // Erişim kontrolü abonelik üzerinden yapılıyor.

    return NextResponse.json({
      success: true,
      message: "Kursa başarıyla kayıt oldunuz!",
      enrollmentId: enrollment.id
    })
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

