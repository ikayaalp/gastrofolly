import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import HomePageClient from "./HomePageClient"
import AIAssistantWidget from "@/components/ai/AIAssistantWidget"

export const metadata: Metadata = {
  title: "Ana Sayfa",
  description: "Culinora'da gastronomi kurslarınızı keşfedin. Profesyonel şeflerden video dersler, kişiselleştirilmiş öneriler.",
}

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
    categories,
    userCourses
  ] = await Promise.all([
    // Öne çıkan kurslar (en yeni)
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        reviews: { select: { rating: true } },
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    }),
    // Popüler kurslar (en çok kayıtlı)
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        reviews: { select: { rating: true } },
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 6
    }),
    // Kategoriler (sadece count al, tüm kurs verisini yükleme)
    prisma.category.findMany({
      include: {
        _count: {
          select: { courses: true }
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
        instructor: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        reviews: { select: { rating: true } },
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
    categories,
    userEnrollments
  } = await getHomeData(session.user.id)

  return (
    <>
      <HomePageClient
        featuredCourses={featuredCourses as any}
        popularCourses={popularCourses as any}
        categories={categories as any}
        userEnrollments={userEnrollments as any}
        session={session}
      />
      <AIAssistantWidget />
    </>
  )
}
