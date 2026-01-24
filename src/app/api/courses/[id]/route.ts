import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/mobileAuth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthUser(request);

        const enrollment = user ? await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: id,
                }
            }
        }) : null;

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
                        videoUrl: true,
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

        // Process lessons to hide videoUrl if not enrolled or not free/first
        const processedLessons = course.lessons.map((lesson, index) => {
            const hasAccess = enrollment || lesson.isFree || index === 0;
            return {
                ...lesson,
                videoUrl: hasAccess ? lesson.videoUrl : null
            };
        });

        const responseData = {
            ...course,
            lessons: processedLessons,
            isEnrolled: !!enrollment,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Course detail error:', error);
        return NextResponse.json(
            { error: 'Kurs detayları yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
