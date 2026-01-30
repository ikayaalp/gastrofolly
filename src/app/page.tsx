import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LandingPageClient from "@/components/home/LandingPageClient";
import AIAssistantWidget from "@/components/ai/AIAssistantWidget";

// Data fetching helper (Server Side)
async function getLandingData() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // 1. Fetch Categories (Small query, mostly static)
  const categoriesPromise = prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { courses: true }
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
        progress: {
          where: { userId: userId },
          select: { percentage: true }
        }
      },
      take: 5
    }).then(courses => courses.map(course => ({
      ...course,
      progress: course.progress[0]?.percentage || 0
    })) as any);
  }

  // Execute all queries in parallel
  const [categoriesData, featured, userCourses] = await Promise.all([
    categoriesPromise,
    featuredPromise,
    userCoursesPromise
  ]);

  // Format categories
  const categories = categoriesData.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    courseCount: c._count.courses
  }));

  return { categories, featured, userCourses };
}


export default async function LandingPage() {
  // Server Component Data Fetching
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
