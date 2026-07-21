import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'
import { isPremiumUser } from '@/lib/subscription'
import { getSignedPlaybackUrl, isYouTubeUrl } from '@/lib/bunnyStream'

// Bir ders için kısa süreli İMZALI playback URL'i döndürür. Erişim kuralı
// src/app/api/courses/[id]/route.ts ile birebir aynıdır: premium / admin / eğitmen /
// ödeme yapmış / ücretsiz kurs / ücretsiz ders / kursun ilk dersi.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    try {
        const { lessonId } = await params
        const user = await getAuthUser(request)

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                order: true,
                isFree: true,
                videoUrl: true,
                courseId: true,
                course: {
                    select: { id: true, isFree: true, instructorId: true },
                },
            },
        })

        if (!lesson || !lesson.course) {
            return NextResponse.json({ error: 'Ders bulunamadı' }, { status: 404 })
        }

        const isAdmin = user?.role === 'ADMIN'
        const isInstructor = !!user && lesson.course.instructorId === user.id
        const hasValidSubscription = isPremiumUser(user)

        const payment = user
            ? await prisma.payment.findFirst({
                  where: {
                      userId: user.id,
                      courseId: lesson.courseId,
                      status: 'COMPLETED',
                      amount: { gt: 0 },
                  },
              })
            : null
        const hasPaid = !!payment

        const hasFullCourseAccess =
            hasValidSubscription || isAdmin || isInstructor || hasPaid || lesson.course.isFree

        // Kursun ilk dersi (en düşük order) her zaman erişilebilir — courses/[id] ile aynı davranış.
        const firstLesson = await prisma.lesson.findFirst({
            where: { courseId: lesson.courseId },
            orderBy: { order: 'asc' },
            select: { id: true },
        })
        const isFirstLesson = firstLesson?.id === lesson.id

        const hasAccess = hasFullCourseAccess || lesson.isFree || isFirstLesson
        if (!hasAccess) {
            return NextResponse.json({ error: 'Bu içeriğe erişiminiz yok' }, { status: 403 })
        }

        if (!lesson.videoUrl) {
            return NextResponse.json({ error: 'Video bulunamadı' }, { status: 404 })
        }

        // Geriye dönük uyumluluk: eski YouTube dersleri doğrudan geçer.
        if (isYouTubeUrl(lesson.videoUrl)) {
            return NextResponse.json({ url: lesson.videoUrl, expiresAt: null })
        }

        // lesson.videoUrl = Bunny GUID → imzalı HLS URL üret.
        const { url, expiresAt } = getSignedPlaybackUrl(lesson.videoUrl)
        return NextResponse.json({ url, expiresAt })
    } catch (error) {
        console.error('[lesson video-url]', error)
        return NextResponse.json({ error: 'Video URL oluşturulamadı' }, { status: 500 })
    }
}
