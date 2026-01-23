import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const instructorId = searchParams.get('instructorId');
        const searchQuery = searchParams.get('search');
        const limit = searchParams.get('limit');

        const where: any = {
            isPublished: true,
        };

        if (instructorId) {
            where.instructorId = instructorId;
        }

        if (searchQuery) {
            where.OR = [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }

        const courses = await prisma.course.findMany({
            where,
            take: limit ? parseInt(limit) : undefined,
            include: {
                instructor: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                lessons: {
                    select: {
                        id: true,
                        duration: true,
                    },
                },
                _count: {
                    select: {
                        lessons: true,
                        enrollments: true,
                        reviews: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Add calculated fields
        const coursesWithStats = courses.map(course => {
            // Calculate average rating if needed (placeholder logic or fetch from reviews)
            // For now simplified as per existing logic
            return {
                ...course,
                averageRating: 4.8, // Mock or calculate
            };
        });

        return NextResponse.json(coursesWithStats);
    } catch (error) {
        console.error('Courses fetch error:', error);
        return NextResponse.json(
            { error: 'Kurslar yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
