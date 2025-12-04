import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { courseId } = await request.json()

        if (!courseId) {
            return NextResponse.json(
                { error: "Course ID is required" },
                { status: 400 }
            )
        }

        // Check if user is enrolled in the course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId
                }
            },
            include: {
                course: {
                    include: {
                        lessons: true
                    }
                }
            }
        })

        if (!enrollment) {
            return NextResponse.json(
                { error: "You are not enrolled in this course" },
                { status: 403 }
            )
        }

        // Check if all lessons are completed
        const totalLessons = enrollment.course.lessons.length

        if (totalLessons === 0) {
            return NextResponse.json(
                { error: "This course has no lessons" },
                { status: 400 }
            )
        }

        const completedLessons = await prisma.progress.count({
            where: {
                userId: session.user.id,
                courseId,
                isCompleted: true
            }
        })

        if (completedLessons < totalLessons) {
            return NextResponse.json(
                {
                    error: "You must complete all lessons to receive a certificate",
                    completed: completedLessons,
                    total: totalLessons
                },
                { status: 400 }
            )
        }

        // Check if certificate already exists
        const existingCertificate = await prisma.certificate.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId
                }
            }
        })

        if (existingCertificate) {
            return NextResponse.json({
                message: "Certificate already exists",
                certificate: existingCertificate
            })
        }

        // Create certificate
        const certificate = await prisma.certificate.create({
            data: {
                userId: session.user.id,
                courseId,
                courseName: enrollment.course.title
            },
            include: {
                course: {
                    select: {
                        title: true
                    }
                }
            }
        })

        return NextResponse.json({
            message: "Certificate generated successfully",
            certificate
        })
    } catch (error) {
        console.error("Certificate generation error:", error)
        return NextResponse.json(
            { error: "Failed to generate certificate" },
            { status: 500 }
        )
    }
}
