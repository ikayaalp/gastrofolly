import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/mobileAuth";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser(request);
        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { title, courseId, coverImage } = body;

        const story = await prisma.story.findUnique({
            where: { id },
        });

        if (!story) {
            return NextResponse.json({ error: "Hikaye bulunamadı" }, { status: 404 });
        }

        const updatedStory = await prisma.story.update({
            where: { id },
            data: { title, courseId: courseId || null, coverImage },
        });

        return NextResponse.json({ success: true, story: updatedStory });
    } catch (error) {
        console.error("Update story error:", error);
        return NextResponse.json(
            { error: "Hikaye güncellenirken hata oluştu" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser(request);
        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const { id } = params;

        const story = await prisma.story.findUnique({
            where: { id },
        });

        if (!story) {
            return NextResponse.json({ error: "Hikaye bulunamadı" }, { status: 404 });
        }

        try {
            if (story.mediaUrl && story.mediaUrl.includes('res.cloudinary.com')) {
                const urlParts = story.mediaUrl.split('/upload/');
                if (urlParts.length === 2) {
                    const pathAndFile = urlParts[1];
                    const withoutVersion = pathAndFile.match(/^v\d+\//) ? pathAndFile.replace(/^v\d+\//, '') : pathAndFile;
                    const publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf('.')) || withoutVersion;
                    
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId, { 
                            resource_type: story.mediaType === 'VIDEO' ? 'video' : 'image' 
                        });
                    }
                }
            }
        } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
        }

        await prisma.story.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete story error:", error);
        return NextResponse.json(
            { error: "Hikaye silinirken hata oluştu" },
            { status: 500 }
        );
    }
}
