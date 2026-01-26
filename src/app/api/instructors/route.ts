import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Fetch all users with role 'INSTRUCTOR'
        const instructors = await prisma.user.findMany({
            where: {
                role: "INSTRUCTOR",
            },
            select: {
                id: true,
                name: true,
                image: true,
                createdCourses: {
                    select: {
                        id: true,
                        enrollments: {
                            select: {
                                id: true,
                            },
                        },
                        reviews: {
                            select: {
                                rating: true,
                            },
                        },
                    },
                },
            },
        });

        // Format the data for the frontend
        const formattedInstructors = instructors.map((chef: any) => {
            let totalStudents = 0;
            let totalRating = 0;
            let reviewCount = 0;

            chef.createdCourses.forEach((course: any) => {
                totalStudents += course.enrollments.length;
                course.reviews.forEach((review: any) => {
                    totalRating += review.rating;
                    reviewCount++;
                });
            });

            const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : "0.0";

            return {
                id: chef.id,
                name: chef.name || "İsimsiz Şef",
                specialty: chef.createdCourses.length > 0 ? "Kıdemli Şef Eğitmeni" : "Eğitmen", // Placeholder specialty
                description: `${chef.name || "Şefimiz"}, gastronomi alanındaki tecrübelerini Culinora öğrencileri ile paylaşıyor.`, // Placeholder description
                image: chef.image,
                rating: averageRating,
                students: totalStudents > 1000 ? `${(totalStudents / 1000).toFixed(1)}k+` : totalStudents.toString(),
                courseCount: chef.createdCourses.length,
            };
        });

        return NextResponse.json({ instructors: formattedInstructors });
    } catch (error: any) {
        console.error("Instructors API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch instructors", message: error.message },
            { status: 500 }
        );
    }
}
