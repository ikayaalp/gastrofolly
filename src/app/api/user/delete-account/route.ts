"use server"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Yetkilendirme gerekli" },
                { status: 401 }
            )
        }

        const userId = session.user.id

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
