import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import HomePageClient from "./HomePageClient"
import AIAssistantWidget from "@/components/ai/AIAssistantWidget"
import { resolveHomeSections } from "@/lib/homeSections"

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
    userCourses,
    activePlan,
    rawInstructors,
    homeCovers,
    homeInstructors,
    homeSectionsRaw
  ] = await Promise.all([
    // Öne çıkan kurslar (en yeni)
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
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
        _count: { select: { enrollments: true, lessons: true } }
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 6
    }),
    // Kategoriler ve her kategori için en fazla 6 kurs
    prisma.category.findMany({
      include: {
        courses: {
          where: { isPublished: true },
          include: {
            instructor: { select: { id: true, name: true, image: true } },
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { enrollments: true, lessons: true } }
          },
          take: 6,
          orderBy: { createdAt: 'desc' }
        },
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
        _count: { select: { lessons: true, enrollments: true } }
      },
      take: 6
    }) : [],
    prisma.subscriptionPlan.findFirst({
      where: { isActive: true, interval: 'monthly' }
    }),
    prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
      select: {
        id: true,
        name: true,
        image: true,
        createdCourses: {
          select: {
            id: true,
            enrollments: { select: { id: true } },
          }
        }
      }
    }),
    // Panelden yönetilen hero kapakları (aktif, sıralı)
    prisma.homeCover.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    }),
    // Panelden yönetilen vitrin eğitmenleri (aktif, sıralı)
    prisma.homeInstructor.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    }),
    // Bölüm sırası/görünürlüğü ve özel bölüm kursları
    prisma.homeSection.findMany({
      include: {
        courses: {
          where: { course: { isPublished: true } },
          orderBy: { order: "asc" },
          include: {
            course: {
              include: {
                instructor: { select: { id: true, name: true, image: true } },
                category: { select: { id: true, name: true, slug: true } },
                _count: { select: { enrollments: true, lessons: true } }
              }
            }
          }
        }
      }
    })
  ])

  const homeSections = resolveHomeSections(homeSectionsRaw)

  // Map courses to the expected "userEnrollments" structure for the client component
  const userEnrollments = userCourses.map(course => ({
    course: course
  }));

  const instructors = rawInstructors.map((chef: any) => {
    let totalStudents = 0;

    chef.createdCourses.forEach((course: any) => {
      totalStudents += course.enrollments.length;
    });

    return {
      id: chef.id,
      name: chef.name || "İsimsiz Şef",
      specialty: chef.createdCourses.length > 0 ? "Kıdemli Şef Eğitmeni" : "Eğitmen",
      students: totalStudents > 1000 ? `${(totalStudents / 1000).toFixed(1)}k+` : totalStudents.toString(),
      courseCount: chef.createdCourses.length,
      image: chef.image,
    };
  });

  return {
    featuredCourses,
    popularCourses,
    categories,
    userEnrollments,
    activePlan,
    instructors,
    homeCovers,
    homeInstructors,
    homeSections
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
    userEnrollments,
    activePlan,
    instructors,
    homeCovers,
    homeInstructors,
    homeSections
  } = await getHomeData(session.user.id)

  return (
    <>
      <HomePageClient
        featuredCourses={featuredCourses as any}
        popularCourses={popularCourses as any}
        categories={categories as any}
        userEnrollments={userEnrollments as any}
        session={session}
        monthlyPrice={activePlan?.price || 399}
        instructors={instructors}
        homeCovers={homeCovers as any}
        homeInstructors={homeInstructors as any}
        homeSections={homeSections}
      />
      <AIAssistantWidget />
    </>
  )
}
