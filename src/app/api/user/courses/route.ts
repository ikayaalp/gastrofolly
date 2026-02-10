import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // Try NextAuth session first (web)
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Try JWT token (mobile)
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { userId: string };
          userId = decoded.userId;
        } catch (err) {
          console.error('JWT verification failed:', err);
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 1. Enrollment kayıtlarından kursları al (kullanıcının "Kursa Başla" dediği kurslar)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true, createdAt: true },
    })

    const enrolledCourseIds = enrollments.map(e => e.courseId)

    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({ courses: [], enrollments: [] })
    }

    // 2. Kullanıcı bilgilerini al (abonelik durumu ve satın alma kayıtları)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        subscriptionEndDate: true,
      }
    })

    const isSubscriptionActive = !!(
      user?.subscriptionPlan &&
      user?.subscriptionEndDate &&
      new Date(user.subscriptionEndDate) > new Date()
    )

    // 3. Satın alınan kursları çek (abonelik bitse bile erişimi devam eden kurslar)
    const paymentRecords = await prisma.payment.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        courseId: { not: null }
      },
      select: { courseId: true }
    })

    const purchasedCourseIds = new Set(
      paymentRecords.map(p => p.courseId).filter(id => id !== null) as string[]
    )

    // 4. Progress kayıtlarını al (ilerleme hesaplaması için)
    const progressRecords = await prisma.progress.findMany({
      where: { userId, courseId: { in: enrolledCourseIds } },
      select: { courseId: true, isCompleted: true, lessonId: true },
    })

    // 5. Kurs detaylarını çek
    const courses = await prisma.course.findMany({
      where: {
        id: { in: enrolledCourseIds },
        isPublished: true
      },
      include: {
        instructor: true,
        category: true,
        lessons: true,
        reviews: true,
        _count: { select: { lessons: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // 6. Abonelik durumuna göre filtrele ve ilerleme hesapla
    const formattedCourses = courses
      .filter(course => {
        // Ücretsiz kurslar her zaman gösterilsin
        if (course.isFree) return true
        // Satın alınan kurslar her zaman gösterilsin
        if (purchasedCourseIds.has(course.id)) return true
        // Abonelik aktifse göster
        if (isSubscriptionActive) return true
        // Abonelik bitmişse gösterme
        return false
      })
      .map(course => {
        const courseProgress = progressRecords.filter(p => p.courseId === course.id)
        const completedLessonsCount = courseProgress.filter(p => p.isCompleted).length
        const totalLessons = course.lessons.length
        let progressPercentage = 0

        if (totalLessons > 0) {
          progressPercentage = Math.round((completedLessonsCount / totalLessons) * 100)
        }

        const isPurchased = purchasedCourseIds.has(course.id)
        const enrollmentRecord = enrollments.find(e => e.courseId === course.id)

        return {
          ...course,
          progress: progressPercentage,
          isPurchased,
          enrolledAt: enrollmentRecord?.createdAt?.toISOString() || new Date().toISOString()
        }
      })

    // 7. Yanıt
    return NextResponse.json({
      courses: formattedCourses,
      enrollments: formattedCourses.map(c => ({
        course: c,
        courseId: c.id,
        userId: userId!,
        createdAt: c.enrolledAt,
        progress: c.progress
      }))
    })

  } catch (error) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
