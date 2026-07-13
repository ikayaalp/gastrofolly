import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/mobileAuth"
import { isPremiumUser } from "@/lib/subscription"

// Helper to get userId from session or JWT token
async function getUserId(request: NextRequest): Promise<string | null> {
  const authUser = await getAuthUser(request)
  return authUser?.id ?? null
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { lessonId, courseId, isCompleted, timeWatched } = await request.json()

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: "Lesson ID and Course ID are required" },
        { status: 400 }
      )
    }

    // Kullanıcının kursa kayıtlı olup olmadığını kontrol et
    let enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        }
      }
    })

    if (!enrollment) {
      // Erişim kontrolü ve Lazy Enrollment
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          subscriptionPlan: true,
          subscriptionEndDate: true,
        }
      })

      // 1. Güvenlik Yaması: lesson'ı doğrudan parametreden gelen courseId ile birlikte arıyoruz.
      // Eğer bu ikisi eşleşmiyorsa, lessonId sahtedir (farklı bir kursun ücretsiz dersidir).
      const lesson = await prisma.lesson.findFirst({ 
        where: { 
          id: lessonId,
          courseId: courseId 
        } 
      })
      
      if (!lesson) {
        return NextResponse.json(
          { error: "Premium subscription required or invalid lesson matching" },
          { status: 403 }
        )
      }

      // 2. Kurs bilgilerini ve ilk dersini çekiyoruz
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          instructorId: true,
          isFree: true,
          lessons: {
            orderBy: { order: 'asc' },
            take: 1,
            select: { id: true }
          }
        }
      })

      // İlk ders önizleme ayrıcalığı (sıralamada ilk dersin id'si)
      const isFirstLessonPreview = course?.lessons?.[0]?.id === lessonId;
      const isAdmin = user?.role === 'ADMIN';
      const isInstructor = course?.instructorId === userId;

      // Kurs satın alınmış mı kontrol et
      const payment = await prisma.payment.findFirst({
        where: {
          userId: userId,
          courseId: courseId,
          status: 'COMPLETED',
          amount: { gt: 0 }
        }
      })
      const hasPaid = !!payment;

      const hasAccess = 
        lesson.isFree || 
        isFirstLessonPreview || 
        (user && isPremiumUser(user)) || 
        isAdmin || 
        isInstructor || 
        hasPaid ||
        course?.isFree;
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Premium subscription required or invalid access" },
          { status: 403 }
        )
      }

      // 3. Race Condition Yaması: Eş zamanlı gelen 2 istekte çökmemesi için create yerine upsert kullanılıyor
      enrollment = await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId,
          }
        },
        update: {},
        create: {
          userId: userId,
          courseId: courseId,
        }
      })
    }

    // İlerleme kaydını oluştur veya güncelle
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: userId,
          lessonId: lessonId,
        }
      },
      update: {
        // Zaten tamamlanmışsa tamamlanmış kalsın; yeni değer true ise tamamla
        isCompleted: isCompleted ? true : undefined,
        ...(typeof timeWatched === 'number' ? { timeWatched: Math.floor(timeWatched) } : {}),
        watchedAt: new Date(),
      },
      create: {
        userId: userId,
        lessonId: lessonId,
        courseId: courseId,
        isCompleted: isCompleted || false,
        timeWatched: typeof timeWatched === 'number' ? Math.floor(timeWatched) : 0,
        watchedAt: new Date(),
      }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    const progress = await prisma.progress.findMany({
      where: {
        userId: userId,
        courseId: courseId,
      },
      include: {
        lesson: true,
      }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
