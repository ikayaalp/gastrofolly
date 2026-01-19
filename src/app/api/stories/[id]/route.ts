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

        // Try deleting file from filesystem
        // Assuming mediaUrl starts with /stories/
        if (story.mediaUrl && story.mediaUrl.startsWith('/stories/')) {
            const fileName = story.mediaUrl.replace('/stories/', '');
            const filePath = path.join(process.cwd(), "public", "stories", fileName);
            try {
                await unlink(filePath);
            } catch (e) {
                console.error("Error deleting file:", e);
                // We don't fail the request if file delete fails, as DB record is gone.
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete story error:", error);
        return NextResponse.json(
            { error: "Hikaye silinirken hata oluştu" },
            { status: 500 }
        );
    }
}
