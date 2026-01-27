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

        // Check for valid subscription
        const hasValidSubscription = user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

        // Process lessons to hide videoUrl if not enrolled or not free/first/subscribed
        const processedLessons = course.lessons.map((lesson, index) => {
            // STRICT ACCESS: removed 'enrollment' check. Only subscribed users or free lessons.
            const hasAccess = hasValidSubscription || lesson.isFree || index === 0;
            return {
                ...lesson,
                videoUrl: hasAccess ? lesson.videoUrl : null
            };
        });

        // Calculate progress if user exists
        let progress = 0;
        if (user) {
            const completedCount = await prisma.progress.count({
                where: {
                    userId: user.id,
                    courseId: id,
                    isCompleted: true
                }
            });
            const totalLessons = course.lessons.length;
            if (totalLessons > 0) {
                progress = Math.round((completedCount / totalLessons) * 100);
            }
        }

        const responseData = {
            ...course,
            lessons: processedLessons,
            isEnrolled: !!enrollment,
            hasAccess: !!hasValidSubscription, // Stictly subscription based
            progress // Added progress percentage
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
