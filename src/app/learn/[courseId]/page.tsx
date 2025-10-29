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

async function getCourseWithProgress(courseId: string, userId: string) {
  console.log('Learn Page - getCourseWithProgress:', { courseId, userId })
  
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  })

  console.log('Learn Page - enrollment found:', enrollment)

  if (!enrollment) {
    console.log('Learn Page - No enrollment found, checking all enrollments for user:', userId)
    const allEnrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true, createdAt: true }
    })
    console.log('Learn Page - All enrollments for user:', allEnrollments)
    return null
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: true,
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

  return { course, progress }
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
  const data = await getCourseWithProgress(courseId, session.user.id)

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

  const { course, progress } = data

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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
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
          />
          
          {/* Comments Section */}
          <div className="p-6">
            <CommentsSection 
              reviews={course.reviews} 
              courseId={course.id}
              canComment={true}
              userId={session.user.id}
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
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Sosyal</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
