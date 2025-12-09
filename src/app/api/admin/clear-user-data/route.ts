import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
    try {
        // Admin authentication check
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
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
