import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/mobileAuth";

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request);

        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const body = await request.json();
        const { storyIds } = body;

        if (!storyIds || !Array.isArray(storyIds)) {
            return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
        }

        const transaction = storyIds.map((id, index) => {
            return prisma.story.update({
                where: { id },
                data: { order: index },
            });
        });

        await prisma.$transaction(transaction);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering stories:", error);
        return NextResponse.json(
            { error: "Hikayeler sıralanırken hata oluştu" },
            { status: 500 }
        );
    }
}
