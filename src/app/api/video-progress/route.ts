import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { lessonId, courseId, timeWatched, isCompleted } = await request.json();

        if (!lessonId || !courseId || timeWatched === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Progress kaydını bul veya oluştur/güncelle
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
                // Eğer yeni tamamlanıyorsa, true yap
                isCompleted: isCompleted ? true : undefined,
                watchedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                courseId: courseId,
                lessonId: lessonId,
                timeWatched: Math.floor(timeWatched),
                isCompleted: isCompleted || false,
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
