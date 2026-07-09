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
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 12
  });



  // 4. Fetch Instructors (Database)
  const instructorsPromise = prisma.user.findMany({
    where: { 
      role: 'INSTRUCTOR', 
      createdCourses: { some: { isPublished: true } } 
    },
    select: {
      id: true,
      name: true,
      image: true
    },
    take: 8
  });

  // Execute all queries in parallel
  const [categoriesData, featured, dbInstructors, activePlan] = await Promise.all([
    categoriesPromise,
    featuredPromise,
    instructorsPromise,
    prisma.subscriptionPlan.findFirst({
      where: { isActive: true, interval: 'monthly' }
    })
  ]);

  const monthlyPrice = activePlan?.price || 399;

  const instructors = dbInstructors.map(inst => {
    let image = inst.image;
    if (image && image.includes('images.unsplash.com')) {
      image = image.replace('w=200', 'w=800&q=80');
    }
    return {
      ...inst,
      name: inst.name || 'Eğitmen',
      image
    };
  });

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

  return { categories, featured: formattedFeatured, instructors, monthlyPrice };
}

import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // If user is logged in, redirect to home
  if (session?.user) {
    redirect("/home");
  }

  // Server Component Data Fetching
  const data = await getLandingData();

  return (
    <>
      <LandingPageClient
        initialCategories={data.categories}
        initialFeatured={data.featured}
        initialInstructors={data.instructors}
        monthlyPrice={data.monthlyPrice}
      />
      <AIAssistantWidget />
    </>
  );
}
