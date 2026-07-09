"use server"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/mobileAuth"

export async function DELETE(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request)
        if (!authUser) {
            return NextResponse.json(
                { error: "Yetkilendirme gerekli" },
                { status: 401 }
            )
        }
        const userId = authUser.id

        // Kullanıcıyı ve ilişkili tüm verilerini sil
        // Prisma cascade delete ayarları sayesinde ilişkili veriler otomatik silinir
        await prisma.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({
            success: true,
            message: "Hesap başarıyla silindi"
        })
    } catch (error) {
        console.error("Delete account error:", error)
        return NextResponse.json(
            { error: "Hesap silinirken bir hata oluştu" },
            { status: 500 }
        )
    }
}
