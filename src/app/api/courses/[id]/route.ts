import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/mobileAuth';
import { isPremiumUser } from '@/lib/subscription';

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
                        pdfUrl: true,
                    },
                },
                _count: {
                    select: {
                        lessons: true,
                        enrollments: true,
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

        const isAdmin = user?.role === 'ADMIN';
        const isInstructor = course.instructorId === user?.id;

        // Check if user has a completed payment for this course
        const payment = user ? await prisma.payment.findFirst({
            where: {
                userId: user.id,
                courseId: id,
                status: 'COMPLETED',
                amount: { gt: 0 }
            }
        }) : null;
        const hasPaid = !!payment;

        // Check for valid subscription
        const hasValidSubscription = isPremiumUser(user);

        const hasFullCourseAccess = hasValidSubscription || isAdmin || isInstructor || hasPaid || course.isFree;

        console.log(`[Course Access] User: ${user?.id || 'anonymous'} | Role: ${user?.role || 'none'} | Plan: ${user?.subscriptionPlan || 'none'} | EndDate: ${user?.subscriptionEndDate || 'null'} | isInstructor: ${isInstructor} | hasPaid: ${hasPaid} | hasFullCourseAccess: ${hasFullCourseAccess}`);

        // Process lessons to hide videoUrl if not enrolled or not free/first/subscribed
        const processedLessons = course.lessons.map((lesson, index) => {
            // STRICT ACCESS: Only allow access if user has full course access, or if the lesson is free, or it is the first lesson
            const hasAccess = hasFullCourseAccess || lesson.isFree || index === 0;
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
            hasAccess: hasFullCourseAccess, // Stictly based on full course access
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
