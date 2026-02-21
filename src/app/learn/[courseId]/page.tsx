import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import VideoPlayer from "@/components/video/VideoPlayer"
import CourseSidebar from "@/components/learn/CourseSidebar"
import CommentsSection from "@/components/course/CommentsSection"
import RecommendedCourses from "@/components/course/RecommendedCourses"
import Link from "next/link"
import { Home, BookOpen, Users, MessageCircle, ChefHat, CheckCircle } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

// types
interface LearnPageLesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  duration: number | null;
  order?: number;
}
interface ReviewItem {
  id: string;
  rating: number;
  user: { name: string | null; image: string | null };
  createdAt: string;
  comment?: string | null;
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
  console.log('Learn Page - getCourseWithProgress:', { courseId, userId, requestedLessonId })

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
      console.log('Learn Page - Access denied: Course is not published')
      return null
    }
  }

  const firstLessonId = courseForFirstLessonCheck.lessons[0]?.id
  const isRequestingFirstLesson = !requestedLessonId || requestedLessonId === firstLessonId

  // Kullanıcı zaten yukarıda çekildi
  // const user = await prisma.user.findUnique(...) -> KALDIRILDI

  // Abonelik süresi devam ediyor mu? (Plan iptal edilmiş olsa bile tarih bitmediyse devam eder)
  const isSubscriptionValid = user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()

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

  console.log('Learn Page - enrollment found:', enrollment)
  console.log('Learn Page - isSubscriptionValid:', isSubscriptionValid)
  console.log('Learn Page - isRequestingFirstLesson:', isRequestingFirstLesson)

  // İlk ders her zaman erişilebilir (enrollment olmasa bile)
  if (isRequestingFirstLesson) {
    console.log('Learn Page - First lesson requested, allowing access')
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
          console.log('Learn Page - Subscription expired for subscription-based enrollment')
          return null
        }
      }
    } else {
      // Kayıt yoksa ama abonelik varsa, otomatik kayıt oluştur
      if (isSubscriptionValid) {
        console.log('Learn Page - Valid subscription found, auto-enrolling user:', userId)
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
        console.log('Learn Page - No enrollment found for user:', userId)
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
      },
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              image: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
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
          enrollments: true,
          reviews: true
        }
      },
      reviews: {
        select: {
          rating: true
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

  // Success parametresi varsa enrollment kontrolünü bypass et (ödeme başarılı ama enrollment henüz oluşturulmamış olabilir)
  if (!data || !data.course) {
    if (resolvedSearchParams?.success) {
      console.log('Learn Page - Success parameter found, bypassing enrollment check temporarily')
      // Success parametresi varsa enrollment'ı manuel oluştur
      try {
        await prisma.enrollment.create({
          data: {
            userId: session.user.id,
            courseId: courseId,
          }
        })
        console.log('Learn Page - Enrollment created successfully')
        // Sayfayı yenile
        redirect(`/learn/${courseId}?success=true${resolvedSearchParams?.fraud_bypassed ? '&fraud_bypassed=true' : ''}`)
      } catch (error) {
        console.log('Learn Page - Enrollment already exists or error:', error)
        // Enrollment zaten varsa devam et
      }
    } else {
      console.log('Learn Page - No enrollment found, redirecting to course detail page')
      // Eğer enrollment yoksa course detail sayfasına yönlendir
      redirect(`/course/${courseId}`)
    }
  }

  // TypeScript için data'nın null olmadığını garanti et
  if (!data || !data.course) {
    redirect(`/course/${courseId}`)
  }

  const { course, progress, hasFullAccess } = data

  // Önerilen kursları al
  const recommendedCourses = await getRecommendedCourses(course.categoryId, course.id)

  // Mevcut dersi belirle
  const currentLessonId = resolvedSearchParams?.lesson || course.lessons[0]?.id
  const lessons: LearnPageLesson[] = course.lessons
  const currentIndex = lessons.findIndex((lesson: LearnPageLesson) => lesson.id === currentLessonId)
  const previousLesson: LearnPageLesson | null = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson: LearnPageLesson | null = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const currentLesson: LearnPageLesson | null = lessons[currentIndex]
  const typedProgress: ProgressItem[] = progress

  // Debug için
  console.log("Learn Page - course lessons:", course.lessons)
  console.log("Learn Page - currentLesson:", currentLesson)
  console.log("Learn Page - currentLesson videoUrl:", currentLesson?.videoUrl)

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
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Culinora</span>
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
            isCompleted={isCompleted}
            previousLesson={previousLesson}
            nextLesson={nextLesson}
            hasFullAccess={hasFullAccess ?? false}
          />

          <div className="p-6 space-y-8">
            {/* Lesson Description */}
            {currentLesson.description && (
              <div className="bg-black border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Ders İçeriği</h2>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {currentLesson.description}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <CommentsSection
              reviews={course.reviews}
              courseId={course.id}
              canComment={true}
              userId={session.user.id}
              instructor={course.instructor}
            />

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
