import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import VideoPlayer from "@/components/video/VideoPlayer"
import CourseSidebar from "@/components/learn/CourseSidebar"
import CommentsSection from "@/components/course/CommentsSection"
import RecommendedCourses from "@/components/course/RecommendedCourses"
import Link from "next/link"
import { Home, BookOpen, Users, MessageCircle, ChefHat } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

interface LearnPageProps {
  params: {
    courseId: string
  }
  searchParams: {
    lesson?: string
  }
}

async function getCourseWithProgress(courseId: string, userId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  })

  if (!enrollment) {
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

  if (!data || !data.course) {
    // Eğer enrollment yoksa course detail sayfasına yönlendir
    redirect(`/course/${courseId}`)
  }

  const { course, progress } = data

  // Önerilen kursları al
  const recommendedCourses = await getRecommendedCourses(course.categoryId, course.id)

  // Mevcut dersi belirle
  const currentLessonId = resolvedSearchParams?.lesson || course.lessons[0]?.id
  const currentLesson = course.lessons.find(lesson => lesson.id === currentLessonId)
  
  // Debug için
  console.log("Learn Page - course lessons:", course.lessons)
  console.log("Learn Page - currentLesson:", currentLesson)
  console.log("Learn Page - currentLesson videoUrl:", currentLesson?.videoUrl)

  if (!currentLesson) {
    notFound()
  }

  // İlerleme durumunu kontrol et
  const lessonProgress = progress.find(p => p.lessonId === currentLesson.id)
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

      <div className="flex pt-16 md:pt-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <VideoPlayer
            lesson={currentLesson}
            course={course}
            userId={session.user.id}
            isCompleted={isCompleted}
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
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
