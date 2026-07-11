import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/mobileAuth"
import { isPremiumUser } from "@/lib/subscription"

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    const userId = authUser.id;

    // getAuthUser zaten guncel abonelik durumunu getiriyor (ve suresi dolmus
    // Premium'u lazy-cleanup ile temizliyor) -- ayrica bir user sorgusuna
    // gerek yok.
    const isSubscriptionActive = isPremiumUser(authUser);

    // 2. Bu kullanıcının "ilişkisi olduğu" tüm kursları topla: Enrollment,
    // Progress (en az 1 ders izlemiş) ve Payment (satın almış). Enrollment
    // satırı sadece 1. dersten sonrasını izleyince otomatik oluşuyor
    // (learn/[courseId]/page.tsx), bu yüzden sadece Enrollment'a bakmak
    // "sadece tanıtımı izledim" durumundaki kursları listeden düşürüyordu.
    // Bu birleşim, /home'daki "Kaldığın Yerden Devam Et" ile aynı mantık.
    const [enrollments, progressRecords, paymentRecords] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId },
        select: { courseId: true, createdAt: true },
      }),
      prisma.progress.findMany({
        where: { userId },
        select: { courseId: true, isCompleted: true, lessonId: true, watchedAt: true },
      }),
      prisma.payment.findMany({
        where: { userId, status: 'COMPLETED', courseId: { not: null } },
        select: { courseId: true },
      }),
    ])

    const purchasedCourseIds = new Set(
      paymentRecords.map(p => p.courseId).filter(id => id !== null) as string[]
    )

    const allCourseIds = Array.from(new Set([
      ...enrollments.map(e => e.courseId),
      ...progressRecords.map(p => p.courseId),
      ...purchasedCourseIds,
    ]))

    if (allCourseIds.length === 0) {
      return NextResponse.json({ courses: [], enrollments: [] })
    }

    // 3. Kurs detaylarını çek
    const courses = await prisma.course.findMany({
      where: {
        id: { in: allCourseIds },
        isPublished: true
      },
      include: {
        instructor: true,
        category: true,
        lessons: true,
        _count: { select: { lessons: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 100
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
        // Enrollment satırı yoksa (sadece izleme/satın alma kaydı varsa), en
        // erken ilerleme tarihini "başladığı tarih" olarak kullan.
        const earliestProgress = courseProgress
          .map(p => p.watchedAt)
          .sort((a, b) => a.getTime() - b.getTime())[0]

        return {
          ...course,
          progress: progressPercentage,
          isPurchased,
          enrolledAt: (enrollmentRecord?.createdAt || earliestProgress || new Date()).toISOString()
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
