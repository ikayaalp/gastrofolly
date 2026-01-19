import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/mobileAuth";
import { unlink } from "fs/promises";
import path from "path";

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

        // Delete from DB
        await prisma.story.delete({
            where: { id },
        });

        /* 
           Cloudinary File Deletion:
           Ideally, we should also delete the file from Cloudinary to save space.
           However, this requires a signed API call (using api_secret), which differs from the unsigned upload flow.
           Given the current context and "stories" being ephemeral/expiring content, 
           we can either set up an auto-delete policy on Cloudinary or implement signed delete later.
           For now, just deleting the database record is sufficient for the UI.
        */

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete story error:", error);
        return NextResponse.json(
            { error: "Hikaye silinirken hata oluştu" },
            { status: 500 }
        );
    }
}
