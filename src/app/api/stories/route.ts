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

        const formData = await request.formData();
        const file = formData.get("media") as File;
        const type = formData.get("mediaType") as string; // 'IMAGE' or 'VIDEO'
        const duration = parseInt(formData.get("duration") as string) || 5000;
        const courseId = formData.get("courseId") as string;

        const title = formData.get("title") as string;
        const coverFile = formData.get("coverImage") as File;

        console.log("---- DEBUG STORY UPLOAD ----");
        console.log("Received Title:", title);
        console.log("Received CoverFile:", coverFile ? coverFile.name : "None");
        console.log("FormData Keys:", Array.from(formData.keys()));
        console.log("----------------------------");

        if (!file) {
            return NextResponse.json({ error: "Medya dosyası bulunamadı" }, { status: 400 });
        }

        // Cloudinary Upload Logic for Main Media
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned';
        const folder = 'stories'; // Separate folder for stories

        if (!cloudName) {
            return NextResponse.json({ error: "Server konfigürasyon hatası (Cloudinary)" }, { status: 500 });
        }

        // Helper to upload to Cloudinary
        const uploadToCloudinary = async (fileToUpload: File, resourceType: 'image' | 'video' = 'image') => {
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
            const uploadFormData = new FormData();
            uploadFormData.append('file', fileToUpload);
            if (uploadPreset) {
                uploadFormData.append('upload_preset', uploadPreset);
            }
            uploadFormData.append('folder', folder);
            uploadFormData.append('public_id', `story_${Date.now()}_${Math.random().toString(36).substring(7)}`);

            const res = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: uploadFormData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error?.message || 'Cloudinary upload failed');
            }
            const data = await res.json();
            return data.secure_url;
        };

        const resourceType = type === 'VIDEO' ? 'video' : 'image';
        const mediaUrl = await uploadToCloudinary(file, resourceType);

        let coverImageUrl = null;
        if (coverFile) {
            // Upload cover image
            coverImageUrl = await uploadToCloudinary(coverFile, 'image');
        }

        // Expiry: Süresiz (100 yıl)
        const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

        const story = await prisma.story.create({
            data: {
                mediaUrl,
                mediaType: type || 'IMAGE',
                duration,
                expiresAt,
                courseId: courseId || null,
                creatorId: user.id,
                title: title || null,
                coverImage: coverImageUrl || null,
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
