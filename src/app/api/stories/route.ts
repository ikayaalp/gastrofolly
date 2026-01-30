import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/mobileAuth";
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// GET: Fetch all active stories
export async function GET(request: NextRequest) {
    try {
        const stories = await prisma.story.findMany({
            where: {
                // Hikayeler artık süresiz (24 saat sınırı kaldırıldı)
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

        // console.log("API GET Stories:", stories.length, stories[0]); // Debug log

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

        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const body = await request.json();
        const { mediaUrl, mediaType, title, coverImage, courseId, duration } = body;

        if (!mediaUrl) {
            return NextResponse.json({ error: "Medya URL bulunamadı" }, { status: 400 });
        }

        // Expiry: Süresiz (100 yıl)
        const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

        const story = await prisma.story.create({
            data: {
                mediaUrl,
                mediaType: mediaType || 'IMAGE',
                duration: duration || (mediaType === 'VIDEO' ? 15000 : 5000),
                expiresAt,
                courseId: courseId || null,
                creatorId: user.id,
                title: title || null,
                coverImage: coverImage || null,
            },
        });

        return NextResponse.json({ success: true, story });

    } catch (error) {
        console.error("Story creation error:", error);
        return NextResponse.json(
            { error: "Hikaye oluşturulurken hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata") },
            { status: 500 }
        );
    }
}
