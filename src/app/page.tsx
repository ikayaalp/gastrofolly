import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LandingPageClient from "@/components/home/LandingPageClient";
import AIAssistantWidget from "@/components/ai/AIAssistantWidget";

// Data fetching helper (Server Side)
async function getLandingData() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // 1. Fetch Categories (With 12 latest courses each)
  const categoriesPromise = prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      courses: {
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          imageUrl: true,
          level: true,
          instructor: {
            select: { name: true, image: true }
          },
          category: {
            select: { id: true, name: true }
          },
          reviews: {
            select: { rating: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 12
      },
      _count: {
        select: {
          courses: {
            where: { isPublished: true }
          }
        }
      }
    }
  });

  // 2. Fetch Featured Courses (Limit 12 for Grid + AutoScroll)
  const featuredPromise = prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      imageUrl: true,
      level: true,
      instructor: {
        select: { name: true, image: true }
      },
      category: {
        select: { id: true, name: true }
      },
      reviews: {
        select: { rating: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 12
  });

  // 3. User Courses (Only if logged in)
  let userCoursesPromise = Promise.resolve([]);

  if (userId) {
    userCoursesPromise = prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [
          {
            enrollments: {
              some: { userId: userId }
            }
          },
          {
            payments: {
              some: {
                userId: userId,
                status: 'COMPLETED',
                amount: { gt: 0 }
              }
            }
          }
        ]
      },
      include: {
        instructor: true,
        _count: {
          select: { lessons: true }
        },
        progress: {
          where: {
            userId: userId,
            isCompleted: true
          }
        }
      },
      take: 5
    }).then(courses => courses.map(course => {
      const totalLessons = course._count.lessons || 0;
      const completedLessons = course.progress.length;
      const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        ...course,
        progress: percentage
      };
    }) as any);
  }

  // Execute all queries in parallel
  const [categoriesData, featured, userCourses] = await Promise.all([
    categoriesPromise,
    featuredPromise,
    userCoursesPromise
  ]);

  // Format featured courses to match interface (handle nulls)
  const formattedFeatured = featured.map(course => ({
    ...course,
    instructor: {
      ...course.instructor,
      name: course.instructor.name || 'Eğitmen',
      image: course.instructor.image || undefined
    }
  }));

  // Format categories
  const categories = categoriesData
    .filter(c => c._count.courses > 0)
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      courseCount: c._count.courses
    }));

  return { categories, featured: formattedFeatured, userCourses };
}


import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // If user is logged in, redirect to home
  if (session?.user) {
    redirect("/home");
  }

  // Server Component Data Fetching (no session needed since user is not logged in)
  const { categories, featured, userCourses } = await getLandingData();

  return (
    <>
      <LandingPageClient
        initialCategories={categories}
        initialFeatured={featured}
        initialUserCourses={userCourses}
      />
      <AIAssistantWidget />
    </>
  );
}
