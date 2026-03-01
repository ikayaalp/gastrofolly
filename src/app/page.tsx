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
    }).then(courses => courses.map((course: any) => {
      const totalLessons = course._count.lessons || 0;
      const completedLessons = course.progress.length;
      const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        ...course,
        progress: percentage
      };
    }) as any);
  }

  // 4. Fetch Instructors (Database)
  const instructorsPromise = prisma.user.findMany({
    where: { role: 'INSTRUCTOR' },
    select: {
      id: true,
      name: true,
      image: true
    },
    take: 8
  });

  // Execute all queries in parallel
  const [categoriesData, featured, userCourses, dbInstructors] = await Promise.all([
    categoriesPromise,
    featuredPromise,
    userCoursesPromise,
    instructorsPromise
  ]);

  // 5. Sample Instructors (Mock - High Quality Images)
  const sampleInstructors = [
    {
      id: "mock-1",
      name: "Şef Kemal Can",
      image: "https://images.unsplash.com/photo-1577219491135-ce39a730fbaf?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-2",
      name: "Şef Ömer Faruk",
      image: "https://images.unsplash.com/photo-1583394828560-ad4807e60744?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-3",
      name: "Şef Murat Yıldız",
      image: "https://images.unsplash.com/photo-1595273670150-db0a3d395797?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-4",
      name: "Şef Selin Kaya",
      image: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-5",
      name: "Şef Ayşe Demir",
      image: "https://images.unsplash.com/photo-1541614101331-1a5a3a194e90?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-6",
      name: "Şef Zeynep Ak",
      image: "https://images.unsplash.com/photo-1590604166326-77871694f284?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-7",
      name: "Şef Caner Tekin",
      image: "https://images.unsplash.com/photo-1544145945-f904253db0ad?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-8",
      name: "Şef Deniz Bulut",
      image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-9",
      name: "Şef Burak Güler",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "mock-10",
      name: "Şef Leyla Korkmaz",
      image: "https://images.unsplash.com/photo-1625631980585-e5faf626f56c?auto=format&fit=crop&q=80&w=600"
    }
  ];

  // Combine database instructors with samples (Keep all 10 samples first)
  // For DB instructors without images, provide a high-quality fallback from the mock list
  const instructors = [
    ...sampleInstructors,
    ...dbInstructors.map((i, idx) => ({
      ...i,
      name: i.name || 'Misafir Şef',
      image: i.image || sampleInstructors[idx % sampleInstructors.length].image
    }))
  ].slice(0, 15);

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
    .filter((c: any) => c._count.courses > 0)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      courseCount: c._count.courses
    }));

  return { categories, featured: formattedFeatured, userCourses, instructors };
}

import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // If user is logged in, redirect to home
  if (session?.user) {
    redirect("/home");
  }

  // Server Component Data Fetching
  const { categories, featured, userCourses, instructors } = await getLandingData();

  return (
    <>
      <LandingPageClient
        initialCategories={categories}
        initialFeatured={featured}
        initialUserCourses={userCourses}
        initialInstructors={instructors}
      />
      <AIAssistantWidget />
    </>
  );
}
