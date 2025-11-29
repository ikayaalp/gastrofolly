import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching featured courses:", error);
    return NextResponse.json({ courses: [] }, { status: 200 });
  }
}
