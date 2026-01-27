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

    // 1. Get Course IDs from Progress (Courses user has started watching)
    const progressRecords = await prisma.progress.findMany({
      where: { userId },
      select: { courseId: true, isCompleted: true, lessonId: true },
    })

    const progressCourseIds = new Set(progressRecords.map(p => p.courseId))

    // 2. Get Course IDs from Payments (Courses user explicitly purchased)
    const paymentRecords = await prisma.payment.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        courseId: { not: null } // Only course payments
      },
      select: { courseId: true }
    })

    const purchasedCourseIds = new Set(paymentRecords.map(p => p.courseId).filter(id => id !== null) as string[])

    // Combine all IDs
    const allCourseIds = Array.from(new Set([...progressCourseIds, ...purchasedCourseIds]))

    if (allCourseIds.length === 0) {
      return NextResponse.json({ courses: [], enrollments: [] })
    }

    // 3. Fetch Course Details
    const courses = await prisma.course.findMany({
      where: {
        id: { in: allCourseIds }
      },
      include: {
        instructor: true,
        category: true,
        lessons: true, // Need lessons to count total for progress
        reviews: true,
        _count: { select: { lessons: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // 4. Calculate Progress for each course
    const formattedCourses = courses.map(course => {
      // Find progress records for this course
      const courseProgress = progressRecords.filter(p => p.courseId === course.id)
      const completedLessonsCount = courseProgress.filter(p => p.isCompleted).length

      const totalLessons = course.lessons.length
      let progressPercentage = 0

      if (totalLessons > 0) {
        progressPercentage = Math.round((completedLessonsCount / totalLessons) * 100)
      }

      // Check if purchased
      const isPurchased = purchasedCourseIds.has(course.id)

      // Use structure compatible with both direct course list and { course: ... } wrapper expectation
      // The mobile app handles `item.course || item`. We will return valid course objects.
      // We also attach `progress` property directly to the course object (or wrapper).

      return {
        ...course,
        progress: progressPercentage,
        isPurchased,
        // Mock enrollment date for compatibility if needed
        enrolledAt: new Date().toISOString()
      }
    })

    // 5. Respond
    // The simplified API returns a list of courses which now represent "My Courses"
    // We wrap it in { courses: ... } as expected by mobile app
    return NextResponse.json({
      courses: formattedCourses,
      // 'enrollments' key kept for backward compatibility if any other component relies strictly on it, 
      // mapping it to look like old enrollment structure
      enrollments: formattedCourses.map(c => ({
        course: c,
        courseId: c.id,
        userId: userId!,
        createdAt: new Date(), // Mock
        progress: c.progress
      }))
    })

  } catch (error) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
