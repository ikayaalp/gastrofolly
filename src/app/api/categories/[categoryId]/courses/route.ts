import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ categoryId: string }> }
) {
    try {
        const { categoryId } = await params;

        const courses = await prisma.course.findMany({
            where: {
                categoryId: categoryId,
                // isPublished: true
            },
            include: {
                instructor: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                reviews: {
                    select: {
                        rating: true
                    }
                },
                _count: {
                    select: {
                        lessons: true,
                        enrollments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format the response
        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            price: course.price,
            imageUrl: course.imageUrl,
            level: course.level,
            duration: course.duration,
            instructor: course.instructor,
            lessonCount: course._count.lessons,
            enrollmentCount: course._count.enrollments,
            averageRating: course.reviews.length > 0
                ? course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length
                : 0,
            reviewCount: course.reviews.length
        }));

        return NextResponse.json({ courses: formattedCourses });
    } catch (error) {
        console.error("Error fetching courses by category DETAILED:", error);
        return NextResponse.json({
            error: "Failed to fetch courses",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
