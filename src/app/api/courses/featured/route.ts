import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all published courses with category info
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        level: true,
        instructor: {
          select: { name: true }
        },
        category: {
          select: { id: true, name: true }
        },
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Group courses by category
    const categoryMap = new Map<string, { id: string; name: string; courses: typeof courses }>();

    courses.forEach(course => {
      if (course.category) {
        const catId = course.category.id;
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, {
            id: catId,
            name: course.category.name,
            courses: []
          });
        }
        categoryMap.get(catId)!.courses.push(course);
      }
    });

    const categories = Array.from(categoryMap.values());

    return NextResponse.json({ courses, categories });
  } catch (error) {
    console.error("Error fetching featured courses:", error);
    return NextResponse.json({ courses: [], categories: [] }, { status: 200 });
  }
}
