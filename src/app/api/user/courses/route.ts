import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // Try NextAuth session first (web)
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Try JWT token (mobile)
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { userId: string };
          userId = decoded.userId;
        } catch (err) {
          console.error('JWT verification failed:', err);
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // İlerleme kaydedilmiş ama enrollment'ı olmayan kursları bul ve enrollment oluştur
    // Bu, "Kaldığın yerden devam et" özelliğinin çalışmasını sağlar
    const userProgress = await prisma.progress.findMany({
      where: { userId },
      select: { courseId: true },
      distinct: ['courseId']
    })

    for (const progress of userProgress) {
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: progress.courseId
          }
        }
      })

      if (!existingEnrollment) {
        console.log(`Auto-enrolling user ${userId} to course ${progress.courseId} based on progress`)
        await prisma.enrollment.create({
          data: {
            userId,
            courseId: progress.courseId
          }
        })
      }
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: true,
            category: true,
            lessons: true,
            reviews: true,
            _count: { select: { lessons: true, enrollments: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      courses: enrollments
    })
  } catch (error) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
