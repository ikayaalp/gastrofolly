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
          const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
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
