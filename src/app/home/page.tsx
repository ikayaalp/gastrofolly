import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import HomePageClient from "./HomePageClient"
import AIAssistantWidget from "@/components/ai/AIAssistantWidget"

async function getHomeData(userId?: string) {
  // Kullanıcı bilgilerini ve ödemelerini al (Erişim kontrolü için)
  let user = null;
  let userCourseIds: string[] = [];

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionEndDate: true,
        payments: {
          where: { status: 'COMPLETED', amount: { gt: 0 } },
          select: { courseId: true }
        },
        progress: {
          select: { courseId: true }
        },
        enrollments: {
          select: { courseId: true }
        }
      }
    });

    if (user) {
      const paymentIds = user.payments.map(p => p.courseId).filter(id => id !== null) as string[];
      const progressIds = user.progress.map(p => p.courseId);
      const enrollmentIds = user.enrollments.map(e => e.courseId);

      // Merge all IDs and remove duplicates
      userCourseIds = Array.from(new Set([...paymentIds, ...progressIds, ...enrollmentIds]));
    }
  }

  const [
    featuredCourses,
    popularCourses,
    recentCourses,
    categories,
    userCourses
  ] = await Promise.all([
    // Öne çıkan kurslar
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: true,
        category: true,
        reviews: true,
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    }),
    // Popüler kurslar (en çok kayıtlı)
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: true,
        category: true,
        reviews: true,
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 6
    }),
    // En yeni kurslar
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: true,
        category: true,
        reviews: true,
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    }),
    // Kategoriler
    prisma.category.findMany({
      include: {
        courses: {
          where: { isPublished: true },
          include: {
            instructor: true,
            category: true,
            reviews: true,
            _count: { select: { enrollments: true, lessons: true } }
          },
          take: 6
        }
      }
    }),
    // Kullanıcının kursları (Progress, Payment veya Enrollment kaynaklı)
    userCourseIds.length > 0 ? prisma.course.findMany({
      where: {
        id: { in: userCourseIds },
        isPublished: true
      },
      include: {
        instructor: true,
        category: true,
        lessons: true,
        reviews: true,
        _count: { select: { lessons: true, enrollments: true } }
      },
      take: 6
    }) : []
  ])

  // Map courses to the expected "userEnrollments" structure for the client component
  const userEnrollments = userCourses.map(course => ({
    course: course
  }));

  return {
    featuredCourses,
    popularCourses,
    recentCourses,
    categories,
    userEnrollments
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const {
    featuredCourses,
    popularCourses,
    recentCourses,
    categories,
    userEnrollments
  } = await getHomeData(session.user.id)

  return (
    <>
      <HomePageClient
        featuredCourses={featuredCourses}
        popularCourses={popularCourses}
        recentCourses={recentCourses}
        categories={categories}
        userEnrollments={userEnrollments}
        session={session}
      />
      <AIAssistantWidget />
    </>
  )
}
