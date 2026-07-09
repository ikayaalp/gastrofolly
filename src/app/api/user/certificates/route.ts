import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/mobileAuth"

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request)
        if (!authUser) {
            return NextResponse.json(
                { error: "Yetkilendirme gerekli" },
                { status: 401 }
            )
        }
        const userId = authUser.id

        const certificates = await prisma.certificate.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        title: true,
                        imageUrl: true,
                        instructor: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { issuedAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            certificates: certificates.map(cert => ({
                id: cert.id,
                courseName: cert.courseName,
                courseImageUrl: cert.course.imageUrl,
                instructorName: cert.course.instructor?.name || 'Eğitmen',
                issuedAt: cert.issuedAt.toISOString(),
            }))
        })
    } catch (error) {
        console.error("Certificates fetch error:", error)
        return NextResponse.json(
            { error: "Sertifikalar alınırken bir hata oluştu" },
            { status: 500 }
        )
    }
}
