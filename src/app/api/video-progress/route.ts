import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPremiumUser } from "@/lib/subscription";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { lessonId, courseId, timeWatched, isCompleted } = await request.json();

        if (!lessonId || typeof lessonId !== 'string' || !courseId || typeof courseId !== 'string') {
            return new NextResponse("Missing required fields", { status: 400 });
        }
        
        if (typeof timeWatched !== 'number' || timeWatched < 0) {
            return new NextResponse("Invalid timeWatched", { status: 400 });
        }

        const lesson = await prisma.lesson.findFirst({ 
            where: { 
                id: lessonId,
                courseId: courseId 
            } 
        });
        
        if (!lesson) {
            return new NextResponse("Premium subscription required or invalid lesson matching", { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                role: true,
                subscriptionPlan: true,
                subscriptionEndDate: true,
            }
        });

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                instructorId: true,
                isFree: true,
                lessons: {
                    orderBy: { order: 'asc' },
                    take: 1,
                    select: { id: true }
                }
            }
        });

        const isFirstLessonPreview = course?.lessons?.[0]?.id === lessonId;
        const isAdmin = user?.role === 'ADMIN';
        const isInstructor = course?.instructorId === session.user.id;

        const payment = await prisma.payment.findFirst({
            where: {
                userId: session.user.id,
                courseId: courseId,
                status: 'COMPLETED',
                amount: { gt: 0 }
            }
        });
        const hasPaid = !!payment;

        const hasAccess = 
            lesson.isFree || 
            isFirstLessonPreview || 
            (user && isPremiumUser(user)) || 
            isAdmin || 
            isInstructor || 
            hasPaid ||
            course?.isFree;
        
        if (!hasAccess) {
            return new NextResponse("Premium subscription required or invalid access", { status: 403 });
        }

        // Progress kaydını bul veya oluştur/güncelle
        // isCompleted daha önce true değilse ve şimdi true oluyorsa completedAt atayacağız
        const existingProgress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId: session.user.id,
                    lessonId: lessonId,
                },
            },
        });

        const shouldMarkCompleted = isCompleted && (!existingProgress || !existingProgress.isCompleted);

        const progress = await prisma.progress.upsert({
            where: {
                userId_lessonId: {
                    userId: session.user.id,
                    lessonId: lessonId,
                },
            },
            update: {
                timeWatched: Math.floor(timeWatched),
                // Eğer daha önce tamamlandıysa, tamamlanmış olarak kalsın
                // Eğer yeni tamamlanıyorsa, true yap ve completedAt ekle
                isCompleted: isCompleted ? true : undefined,
                completedAt: shouldMarkCompleted ? new Date() : undefined,
                watchedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                courseId: courseId,
                lessonId: lessonId,
                timeWatched: Math.floor(timeWatched),
                isCompleted: isCompleted || false,
                completedAt: isCompleted ? new Date() : null,
            },
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error("[VIDEO_PROGRESS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const lessonId = searchParams.get("lessonId");

        if (!lessonId) {
            return new NextResponse("Lesson ID required", { status: 400 });
        }

        const progress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId: session.user.id,
                    lessonId: lessonId,
                },
            },
            select: {
                timeWatched: true,
                isCompleted: true,
            }
        });

        return NextResponse.json(progress || { timeWatched: 0, isCompleted: false });
    } catch (error) {
        console.error("[VIDEO_PROGRESS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
