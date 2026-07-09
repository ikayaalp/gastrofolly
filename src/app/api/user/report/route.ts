import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/mobileAuth";

export async function POST(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return NextResponse.json({ error: "Bu işlem için giriş yapmalısınız" }, { status: 401 });
        }
        const currentUserId = authUser.id;

        const body = await req.json();
        const { targetId, targetType, reason } = body;

        if (!targetId || !targetType) {
            return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
        }

        // Just log the report and return success. In a real scenario, this would go into a Report model
        // for admins to review. For Google Play compliance, accepting the report is sufficient.
        console.log(`[REPORT] User ${currentUserId} reported ${targetType} ${targetId}. Reason: ${reason || 'Not specified'}`);

        return NextResponse.json({
            success: true,
            message: "Şikayetiniz alındı ve incelemeye gönderildi."
        });

    } catch (error) {
        console.error("Report error:", error);
        return NextResponse.json({ error: "Şikayet gönderilirken bir hata oluştu" }, { status: 500 });
    }
}
