import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/mobileAuth";
import { v2 as cloudinary } from 'cloudinary';

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

        if (!file) {
            return NextResponse.json({ error: "Medya dosyası bulunamadı" }, { status: 400 });
        }

        // Cloudinary Upload Logic
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'chef-courses-unsigned';
        const folder = 'stories'; // Separate folder for stories

        if (!cloudName) {
            return NextResponse.json({ error: "Server konfigürasyon hatası (Cloudinary)" }, { status: 500 });
        }

        // Determine resource type based on input
        // Note: 'video' resource type covers videos, 'image' covers images.
        // If coming from our admin panel, type might be 'VIDEO' or 'IMAGE'.
        // Cloudinary expects lowercase 'video' or 'image' typically for the API URL, 
        // OR 'auto' if using the unsigned upload correctly.

        const resourceType = type === 'VIDEO' ? 'video' : 'image';
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        if (uploadPreset) {
            uploadFormData.append('upload_preset', uploadPreset);
        }
        uploadFormData.append('folder', folder);
        uploadFormData.append('public_id', `story_${Date.now()}`);

        const cloudRes = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: uploadFormData
        });

        if (!cloudRes.ok) {
            const errData = await cloudRes.json();
            console.error('Cloudinary upload error:', errData);
            throw new Error(errData.error?.message || 'Cloudinary upload failed');
        }

        const cloudData = await cloudRes.json();
        const mediaUrl = cloudData.secure_url;

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
            { error: "Hikaye oluşturulurken hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata") },
            { status: 500 }
        );
    }
}
