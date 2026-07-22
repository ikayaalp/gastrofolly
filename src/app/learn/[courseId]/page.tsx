import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { isPremiumUser } from "@/lib/subscription"
import VideoPlayer from "@/components/video/VideoPlayer"
import CourseSidebar from "@/components/learn/CourseSidebar"
import RecommendedCourses from "@/components/course/RecommendedCourses"
import Link from "next/link"
import Image from "next/image"
import { Home, BookOpen, Users, MessageCircle, ChefHat, CheckCircle } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

// types
interface LearnPageLesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  duration: number | null;
  order?: number;
}
interface ProgressItem {
  lessonId: string;
  isCompleted: boolean;
  lesson: LearnPageLesson;
}

interface LearnPageProps {
  params: Promise<{
    courseId: string
  }>
  searchParams: Promise<{
    lesson?: string
    success?: string
    fraud_bypassed?: string
  }>
}

async function getCourseWithProgress(courseId: string, userId: string, requestedLessonId?: string) {


  const courseForFirstLessonCheck = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        take: 1
      }
    }
  })

  // Ders bulunamadıysa hemen null dön
  if (!courseForFirstLessonCheck) {
    return null
  }

  // Kullanıcı bilgisini çek (rol kontrolü için role eklendi)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionPlan: true,
      subscriptionEndDate: true,
      payments: {
        where: {
          courseId: courseId,
          status: 'COMPLETED',
          amount: { gt: 0 }
        }
      }
    }
  })

  // Taslak kontrolü: Yayınlanmamış kursu sadece eğitmen ve admin görebilir
  if (!courseForFirstLessonCheck.isPublished) {
    const isInstructor = userId === courseForFirstLessonCheck.instructorId
    const isAdmin = user?.role === 'ADMIN'

    if (!isInstructor && !isAdmin) {

      return null
    }
  }

  const firstLessonId = courseForFirstLessonCheck.lessons[0]?.id
  const isRequestingFirstLesson = !requestedLessonId || requestedLessonId === firstLessonId

  // Kullanıcı zaten yukarıda çekildi
  // const user = await prisma.user.findUnique(...) -> KALDIRILDI

  // Abonelik süresi devam ediyor mu? (Plan iptal edilmiş olsa bile tarih bitmediyse devam eder)
  const isSubscriptionValid = isPremiumUser(user)

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    },
    include: {
      course: {
        select: { isFree: true }
      }
    }
  })



  // İlk ders her zaman erişilebilir (enrollment olmasa bile)
  if (isRequestingFirstLesson) {

    // İlk derse erişim izni var, devam et
  } else {
    // Diğer dersler için normal erişim kontrolü
    if (enrollment) {
      // 1. Kurs ücretsiz mi?
      if (enrollment.course.isFree) {
        // Erişim izni var
      }
      // 2. Satın alınmış mı?
      else if (user?.payments && user.payments.length > 0) {
        // Erişim izni var
      }
      // 3. Abonelik ile mi gelmiş?
      else {
        // Abonelik süresi bitmişse erişimi kes
        if (!isSubscriptionValid) {

          return null
        }
      }
    } else {
      // Kayıt yoksa ama abonelik varsa, otomatik kayıt oluştur
      if (isSubscriptionValid) {

        await prisma.enrollment.create({
          data: {
            userId,
            courseId
          },
          include: {
            course: {
              select: { isFree: true }
            }
          }
        })
      } else {
        // Kayıt yok ve abonelik yok -> erişim yok (ilk ders değilse)

        return null
      }
    }
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true
        }
      },
      category: true,
      lessons: {
        orderBy: { order: 'asc' }
      }
    }
  })

  const progress = await prisma.progress.findMany({
    where: {
      userId,
      courseId
    },
    include: {
      lesson: true
    }
  })

  if (!course) {
    return null
  }

  // Güvenlik: Erişimi olmayan derslerin videoUrl'ini client'a hiç gönderme.
  // (Mobil API ile aynı mantık; ilk ders + ücretsiz dersler herkese, gerisi
  // sadece tam erişimi olanlara açık.) Aksi halde ücretsiz bir hesap ile ilk
  // dersi açan biri, sayfa yükünden tüm ücretli ders linklerini toplayabilir.
  const hasFullCourseAccess =
    course.isFree ||
    (user?.payments && user.payments.length > 0) ||
    isSubscriptionValid ||
    user?.role === 'ADMIN' ||
    course.instructorId === userId

  if (!hasFullCourseAccess) {
    for (const lesson of course.lessons) {
      const lessonAccessible = lesson.isFree || lesson.id === firstLessonId
      if (!lessonAccessible) {
        lesson.videoUrl = null
      }
    }
  }

  // İlk ders için erişim kontrolü bilgisini de döndür
  return { course, progress, isRequestingFirstLesson, hasFullAccess: !!enrollment || isSubscriptionValid }
}

async function getRecommendedCourses(categoryId: string, currentCourseId: string) {
  return await prisma.course.findMany({
    where: {
      categoryId,
      isPublished: true,
      id: { not: currentCourseId }
    },
    include: {
      instructor: {
        select: {
          name: true,
          image: true
        }
      },
      category: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          enrollments: true
        }
      },
      lessons: {
        select: {
          duration: true
        }
      }
    },
    take: 4,
    orderBy: [
      { enrollments: { _count: 'desc' } },
      { createdAt: 'desc' }
    ]
  })
}

export default async function LearnPage({ params, searchParams }: LearnPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const { courseId } = await params
  const resolvedSearchParams = await searchParams
  const data = await getCourseWithProgress(courseId, session.user.id, resolvedSearchParams?.lesson)

  if (!data || !data.course) {
    redirect(`/course/${courseId}`)
  }

  // TypeScript için data'nın null olmadığını garanti et
  if (!data || !data.course) {
    redirect(`/course/${courseId}`)
  }

  const { course, progress, hasFullAccess } = data

  // Önerilen kursları al
  const recommendedCourses = await getRecommendedCourses(course.categoryId, course.id)

  // Mevcut dersi belirle
  let currentLessonId = resolvedSearchParams?.lesson

  // Eğer URL'de lesson parametresi yoksa, kullanıcının en son izlediği dersi bul
  if (!currentLessonId && progress && progress.length > 0) {
    // Önce tamamlanmamış en son izlenen dersi bul
    const lastWatchedIncomplete = [...progress]
      .filter((p: any) => !p.isCompleted)
      .sort((a: any, b: any) => new Date(b.watchedAt || 0).getTime() - new Date(a.watchedAt || 0).getTime())[0];

    if (lastWatchedIncomplete) {
      currentLessonId = lastWatchedIncomplete.lessonId;
    } else {
      // Hepsi tamamlandıysa veya tamamlanmamış yoksa en son izlenen dersi aç
      const lastWatched = [...progress].sort((a: any, b: any) => new Date(b.watchedAt || 0).getTime() - new Date(a.watchedAt || 0).getTime())[0];
      if (lastWatched) {
        currentLessonId = lastWatched.lessonId;
      }
    }
  }

  // Son çare olarak ilk dersi aç
  if (!currentLessonId) {
    currentLessonId = course.lessons[0]?.id;
  }
  const lessons: LearnPageLesson[] = course.lessons
  const currentIndex = lessons.findIndex((lesson: LearnPageLesson) => lesson.id === currentLessonId)
  const previousLesson: LearnPageLesson | null = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson: LearnPageLesson | null = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const currentLesson: LearnPageLesson | null = lessons[currentIndex]
  const typedProgress: ProgressItem[] = progress

  // Debug için


  if (!currentLesson) {
    notFound()
  }

  // İlerleme durumunu kontrol et
  const lessonProgress = typedProgress.find((p: ProgressItem) => p.lessonId === currentLesson.id)
  const isCompleted = lessonProgress?.isCompleted || false

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center gap-0.5">
            <div className="relative w-8 h-8">

              <Image

                src="/logo.png"

                alt="C"

                fill

                className="object-contain"

              />

            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-orange-500" style={{ marginLeft: "-6px" }}>ulin</span><span className="text-white" style={{ marginLeft: "0px" }}>ora</span>
            </span>
          </Link>
          <UserDropdown />
        </div>
      </div>

      {/* Success Alert */}
      {resolvedSearchParams?.success && (
        <div className="fixed top-20 left-4 right-4 z-40 md:top-4 md:left-auto md:right-4 md:w-96">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-2 mr-3">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-green-400 font-semibold text-lg">Ödeme Başarılı!</h3>
                <p className="text-gray-300 text-sm">
                  {resolvedSearchParams?.fraud_bypassed
                    ? "Ödeme tamamlandı. Kursunuza hoş geldiniz!"
                    : "Kursunuz başarıyla satın alındı. İyi öğrenmeler!"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex pt-16 md:pt-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <VideoPlayer
            lesson={currentLesson}
            course={course}
            userId={session.user.id}
            userEmail={session.user.email}
            isCompleted={isCompleted}
            previousLesson={previousLesson}
            nextLesson={nextLesson}
            hasFullAccess={hasFullAccess ?? false}
          />

          <div className="p-6 space-y-8">
            {/* Lesson Content / Material */}
            {(currentLesson.description || currentLesson.pdfUrl) && (
              <div className="bg-black border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Ders İçeriği</h2>
                  {currentLesson.pdfUrl && (
                    <a
                      href={currentLesson.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Reçete / PDF
                    </a>
                  )}
                </div>
                {currentLesson.description && (
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {currentLesson.description}
                  </div>
                )}
              </div>
            )}

            {/* Recommended Courses */}
            <RecommendedCourses
              courses={recommendedCourses}
              currentCourseId={course.id}
            />
          </div>
        </div>

        {/* Sidebar - Bağımsız Scroll */}
        <CourseSidebar
          course={course}
          progress={progress}
          currentLessonId={currentLesson.id}
          hasFullAccess={hasFullAccess ?? false}
        />
      </div>


    </div>
  )
}
