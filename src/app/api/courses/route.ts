import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const instructorId = searchParams.get('instructorId');
        const searchQuery = searchParams.get('search');
        const limit = searchParams.get('limit');
        const page = searchParams.get('page');
        const categoryId = searchParams.get('categoryId');
        const sort = searchParams.get('sort');

        const take = limit ? parseInt(limit) : undefined;
        const skip = page && take ? (parseInt(page) - 1) * take : undefined;

        const where: any = {
            isPublished: true,
        };

        if (instructorId) {
            where.instructorId = instructorId;
        }

        if (categoryId && categoryId !== 'all') {
            where.categoryId = categoryId;
        }

        if (searchQuery) {
            where.OR = [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
                { instructor: { name: { contains: searchQuery, mode: 'insensitive' } } },
            ];
        }

        const courses = await prisma.course.findMany({
            where,
            take,
            skip,
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
                    },
                },
            },
            orderBy: sort === 'popular' 
                ? { enrollments: { _count: 'desc' } }
                : { createdAt: 'desc' },
        });

        if (page) {
            const total = await prisma.course.count({ where });
            return NextResponse.json({
                courses,
                total,
                hasMore: take ? (skip || 0) + take < total : false
            }, {
                headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
            });
        }

        return NextResponse.json(courses, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
        });
    } catch (error) {
        console.error('Courses fetch error:', error);
        return NextResponse.json(
            { error: 'Kurslar yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
