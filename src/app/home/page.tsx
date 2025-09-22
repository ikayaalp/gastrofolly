import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import HomePageClient from "./HomePageClient"

async function getHomeData(userId?: string) {
  const [
    featuredCourses,
    popularCourses,
    recentCourses,
    categories,
    userEnrollments
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
    // Kullanıcının kayıtlı olduğu kurslar
    userId ? prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: true,
            category: true,
            lessons: true,
            reviews: true,
            _count: { select: { lessons: true, enrollments: true } }
          }
        }
      },
      take: 6
    }) : []
  ])

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
    <HomePageClient
      featuredCourses={featuredCourses}
      popularCourses={popularCourses}
      recentCourses={recentCourses}
      categories={categories}
      userEnrollments={userEnrollments}
      session={session}
    />
  )
}
