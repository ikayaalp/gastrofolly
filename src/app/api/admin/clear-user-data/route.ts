import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
    try {
        // 1. Tüm Progress kayıtlarını sil
        const deletedProgress = await prisma.progress.deleteMany({})

        // 2. Tüm Enrollment kayıtlarını sil
        const deletedEnrollments = await prisma.enrollment.deleteMany({})

        return NextResponse.json({
            success: true,
            message: "Tüm kullanıcı kayıtları temizlendi",
            data: {
                deletedProgress: deletedProgress.count,
                deletedEnrollments: deletedEnrollments.count
            }
        })

    } catch (error) {
        console.error("Clear user data error:", error)
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        )
    }
}
