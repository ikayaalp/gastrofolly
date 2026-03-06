import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
    try {
        let userId: string | null = null

        // Try NextAuth session first (web)
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            userId = session.user.id
        } else {
            // Try JWT token (mobile)
            const authHeader = request.headers.get('authorization')
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7)
                try {
                    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { userId: string }
                    userId = decoded.userId
                } catch (err) {
                    console.error('JWT verification failed:', err)
                }
            }
        }

        if (!userId) {
            return NextResponse.json(
                { error: "Yetkilendirme gerekli" },
                { status: 401 }
            )
        }

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
