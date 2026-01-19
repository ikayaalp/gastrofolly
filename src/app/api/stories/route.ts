import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/mobileAuth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Fetch all active stories
export async function GET(request: NextRequest) {
    try {
        const stories = await prisma.story.findMany({
            where: {
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Group stories by creator to match frontend structure logic
        // For now, if mostly admin creates, they might be same user.
        // We will group them by creatorId on the frontend or backend.

        return NextResponse.json({ success: true, stories });
    } catch (error) {
        console.error("Error fetching stories:", error);
        return NextResponse.json(
            { error: "Hikayeler yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}

// POST: Create a new story
export async function POST(request: NextRequest) {
    try {
        // Auth Check
        const user = await getAuthUser(request);
        // You might need a more robust check here depending on your auth strategy (session vs token)
        // For now assuming getAuthUser handles it or we might need NextAuth session check
        // If getAuthUser returns null, we might try session.

        // NOTE: If getAuthUser relies on Authorization header, ensure your client sends it.
        // If this is from Admin Panel (web), we usually use current session.
        // Let's assume for admin panel we use session for now, fallback to token.

        /* 
           For simplicity in this task scope, let's assume we proceed if we can identify an admin/instructor. 
           Adjust this auth logic to match your project's `api/upload-video` pattern.
        */

        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
            // Fallback: Check if it is a NextAuth session request (from Web Admin)
            // But `getAuthUser` effectively checks headers. 
            // For web admin form submissions, typically we rely on cookie session.
            // Let's assume for moment we are using the same auth or trust it if testing locally.
            // If strictly needed: import { getServerSession } from "next-auth"; ...
        }

        // Since `api/upload-video` uses `getAuthUser`, we follow that pattern.
        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("media") as File;
        const type = formData.get("mediaType") as string; // 'IMAGE' or 'VIDEO'
        const duration = parseInt(formData.get("duration") as string) || 5000;
        const courseId = formData.get("courseId") as string;

        if (!file) {
            return NextResponse.json({ error: "Medya dosyası bulunamadı" }, { status: 400 });
        }

        // Save File Locally (public/stories)
        const storiesDir = path.join(process.cwd(), "public", "stories");
        try {
            await mkdir(storiesDir, { recursive: true });
        } catch {
            // dir exists
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${originalName}`;
        const filePath = path.join(storiesDir, fileName);

        await writeFile(filePath, buffer);

        const mediaUrl = `/stories/${fileName}`;

        // Expiry: 24 hours from now
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const story = await prisma.story.create({
            data: {
                mediaUrl,
                mediaType: type || 'IMAGE',
                duration,
                expiresAt,
                courseId: courseId || null,
                creatorId: user.id,
            },
        });

        return NextResponse.json({ success: true, story });

    } catch (error) {
        console.error("Story creation error:", error);
        return NextResponse.json(
            { error: "Hikaye oluşturulurken hata oluştu" },
            { status: 500 }
        );
    }
}
