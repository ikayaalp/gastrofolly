import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const course = await prisma.course.findUnique({
            where: { id },
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
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        duration: true,
                        isFree: true,
                        order: true,
                    },
                },
                reviews: {
                    include: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
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
        });

        if (!course) {
            return NextResponse.json(
                { error: 'Kurs bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error('Course detail error:', error);
        return NextResponse.json(
            { error: 'Kurs detayları yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
