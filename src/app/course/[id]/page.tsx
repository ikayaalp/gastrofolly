import { notFound } from "next/navigation"
import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import {
  ChefHat,
  Clock,
  Star,
  Users,
  Play,
  CheckCircle,
  Lock,
  Home,
  BookOpen,
  MessageCircle,
  Crown,
  Zap
} from "lucide-react"
import FavoriteButton from "@/components/course/FavoriteButton"
import ShareButton from "@/components/course/ShareButton"
import CommentsSection from "@/components/course/CommentsSection"
import UserDropdown from "@/components/ui/UserDropdown"
import NotificationDropdown from "@/components/ui/NotificationDropdown"
import FreeLessonModal from "@/components/course/FreeLessonModal"
import AIAssistantWidget from "@/components/ai/AIAssistantWidget"

interface CoursePageProps {
  params: Promise<{
    id: string
  }>
}

async function getCourse(id: string) {
  return await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: true,
      category: true,
      lessons: {
        orderBy: { order: 'asc' }
      },
      enrollments: {
        include: {
          user: true
        }
      },
      reviews: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      _count: {
        select: {
          lessons: true,
          enrollments: true,
          reviews: true
        }
      }
    }
  })
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { id } = await params
  const course = await getCourse(id)

  if (!course) {
    return {
      title: "Kurs Bulunamadı",
    }
  }

  return {
    title: course.title,
    description: course.description?.substring(0, 160) || "Bu kurs hakkında detaylı bilgi edinin.",
    openGraph: {
      title: course.title,
      description: course.description?.substring(0, 160),
      images: course.imageUrl ? [course.imageUrl] : [],
      url: `https://culinora.net/course/${course.id}`,
      type: 'website',
    },
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params


  const course = await getCourse(id)

  if (!course) {
    notFound()
  }

  // Taslak kurs kontrolü: Sadece eğitmen ve admin görebilir
  if (!course.isPublished) {
    const isInstructor = session?.user?.id === course.instructorId
    const isAdmin = session?.user?.role === 'ADMIN'

    if (!isInstructor && !isAdmin) {
      notFound()
    }
  }

  // Kullanıcının abonelik durumunu kontrol et
  let hasActiveSubscription = false
  let userSubscriptionLevel = 0 // 0: yok, 1: Commis, 2: Chef D party, 3: Executive

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, subscriptionEndDate: true }
    })

    if (user?.subscriptionPlan && user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()) {
      hasActiveSubscription = true
      // Abonelik seviyesini belirle
      if (user.subscriptionPlan === 'Premium') userSubscriptionLevel = 99 // Tüm kurslara erişim
      else if (user.subscriptionPlan === 'Commis') userSubscriptionLevel = 1
      else if (user.subscriptionPlan === 'Chef D party') userSubscriptionLevel = 2
      else if (user.subscriptionPlan === 'Executive') userSubscriptionLevel = 3
    }
  }

  // Kurs seviyesini belirle
  const courseLevelValue = course.level === 'BEGINNER' ? 1 : course.level === 'INTERMEDIATE' ? 2 : 3

  // Kullanıcı enrollment'a sahip mi veya aboneliği kursu kapsıyor mu?
  const isEnrolled = session?.user?.id
    ? course.enrollments.some((enrollment: { userId: string }) => enrollment.userId === session.user.id) ||
    (hasActiveSubscription && userSubscriptionLevel >= courseLevelValue)
    : false

  const averageRating = course.reviews.length > 0
    ? course.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / course.reviews.length
    : 0

  const totalDuration = course.lessons.reduce((acc: number, lesson: { duration: number | null }) => acc + (lesson.duration || 0), 0)

  // Kullanıcının bu kursta ilerleme kaydı var mı kontrol et
  let hasProgress = false
  if (session?.user?.id && isEnrolled) {
    const userProgress = await prisma.progress.findFirst({
      where: {
        userId: session.user.id,
        courseId: course.id
      }
    })
    hasProgress = !!userProgress
  }

  // Structured Data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "Culinora",
      "sameAs": "https://culinora.net"
    },
    "instructor": {
      "@type": "Person",
      "name": course.instructor.name || "Culinora Şefi"
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "courseWorkload": `PT${Math.round(totalDuration)}M`
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Culinora</span>
                {session?.user?.role === 'ADMIN' && (
                  <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                )}
              </Link>
              {session?.user && (
                <nav className="hidden md:flex space-x-6">
                  <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                    Ana Sayfa
                  </Link>
                  <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                    Kurslarım
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <>
                      <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                        Admin Paneli
                      </Link>
                      <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                        Kurs Yönetimi
                      </Link>
                    </>
                  )}
                  <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                    Chef Sosyal
                  </Link>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                    İletişim
                  </Link>
                </nav>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {session?.user ? (
                <UserDropdown />
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-300 hover:text-orange-500"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Culinora</span>
            {session?.user?.role === 'ADMIN' && (
              <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">Admin</span>
            )}
          </Link>
          <div className="flex items-center space-x-3">
            {session?.user ? (
              <>
                <NotificationDropdown />
                <UserDropdown />
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-gray-300 hover:text-orange-500 text-sm"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </div>



      {/* Breadcrumb */}
      <div className="bg-black/30 border-b border-black pt-20 md:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/home" className="text-gray-400 hover:text-orange-500">
              Ana Sayfa
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white">{course.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="bg-black border border-black rounded-xl shadow-lg overflow-hidden mb-8">
              {course.imageUrl ? (
                <div className="relative w-full h-64">
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 100vw"
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <ChefHat className="h-24 w-24 text-white" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">



                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                  {course.title}
                </h1>

                <p className="text-gray-300 mb-6">
                  {course.description}
                </p>

                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex items-center">
                    <img
                      src={course.instructor.image || "/api/placeholder/40/40"}
                      alt={course.instructor.name || "Eğitmen"}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <Link
                        href={`/instructor/${course.instructor.id}`}
                        className="font-semibold text-white hover:text-orange-500 transition-colors cursor-pointer"
                      >
                        {course.instructor.name}
                      </Link>
                      <p className="text-sm text-gray-400">Eğitmen</p>
                    </div>
                  </div>


                </div>

                <div className="grid grid-cols-2 gap-4 text-center border-t pt-6">
                  <div>
                    <div className="flex items-center justify-center mb-2">
                      <Play className="h-5 w-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {course._count.lessons}
                    </p>
                    <p className="text-sm text-gray-400">Ders</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(totalDuration / 60)}
                    </p>
                    <p className="text-sm text-gray-400">Saat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="bg-black border border-black rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Kurs İçeriği</h2>
              <div className="space-y-4">
                {course.lessons.map((lesson: { id: string; isFree?: boolean | null; duration?: number | null; title: string; description?: string | null }, index: number) => {
                  // İlk ders her zaman erişilebilir
                  const isFirstLesson = index === 0
                  const canAccess = isEnrolled || isFirstLesson

                  const lessonContent = (
                    <div
                      className={`flex items-center justify-between p-4 border border-black rounded-lg transition-colors ${canAccess ? 'hover:border-orange-500/50 cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center">
                        <div className="bg-orange-500/20 text-orange-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                          {index + 1}
                        </div>
                        <div className="flex items-center">
                          {isFirstLesson || lesson.isFree ? (
                            <Play className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <Lock className="h-4 w-4 text-orange-500 mr-2" />
                          )}
                          <div>
                            <h3 className="font-semibold text-white">
                              {lesson.title}
                            </h3>
                            {lesson.description && (
                              <p className="text-sm text-gray-400">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {lesson.duration && (
                          <span className="text-sm text-gray-400">
                            {lesson.duration} dk
                          </span>
                        )}
                        {isFirstLesson ? (
                          <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-semibold">
                            Ücretsiz Önizleme
                          </span>
                        ) : lesson.isFree ? (
                          <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-semibold">
                            Ücretsiz
                          </span>
                        ) : (
                          <span className="bg-black text-gray-300 px-2 py-1 rounded text-xs border border-orange-500/30">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  )

                  // Kayıtlı kullanıcılar için normal link
                  if (isEnrolled) {
                    return (
                      <Link key={lesson.id} href={`/learn/${course.id}?lesson=${lesson.id}`}>
                        {lessonContent}
                      </Link>
                    )
                  }

                  // İlk ders için popup modal (kayıtlı değilse)
                  if (isFirstLesson) {
                    return (
                      <FreeLessonModal
                        key={lesson.id}
                        lesson={{
                          id: lesson.id,
                          title: lesson.title,
                          description: lesson.description || null,
                          videoUrl: (course.lessons[0] as { videoUrl?: string | null }).videoUrl || null,
                          duration: lesson.duration || null
                        }}
                        courseTitle={course.title}
                      />
                    )
                  }

                  // Erişimi yoksa sadece göster
                  return <div key={lesson.id}>{lessonContent}</div>
                })}
              </div>
            </div>

            {/* Yorumlar Bölümü Kaldırıldı */}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-black border border-black rounded-xl shadow-lg p-6 sticky top-8">
              {isEnrolled ? (
                <>
                  <Link
                    href={`/learn/${course.id}`}
                    className={`w-full text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center mb-3 ${hasProgress
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {hasProgress ? 'Kursa Devam Et' : 'Kursa Başla'}
                  </Link>
                </>
              ) : (
                <>
                  {/* Abonelik Mesajı */}
                  {/* Abonelik Mesajı */}
                  <div className="border rounded-xl p-6 mb-6 text-center bg-orange-900/20 border-orange-500/30">
                    <div className="rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-orange-600">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Premium Üyelik Gerekli
                    </h3>
                    <p className="text-gray-300 mb-4 text-sm">
                      Bu kursa erişmek için Premium üye olmalısınız.
                    </p>
                    <div className="text-3xl font-bold text-white mb-1">
                      299 ₺
                      <span className="text-sm text-gray-400 ml-2 font-normal">/ Aylık</span>
                    </div>
                  </div>

                  {/* Abonelik Butonu */}
                  <Link
                    href={`/subscription?courseId=${course.id}&plan=Premium`}
                    className="w-full text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center mb-3 bg-orange-600 hover:bg-orange-700"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Premium Ol
                  </Link>
                </>
              )}

              {/* Favorite Button */}
              <div className="mt-4">
                <FavoriteButton
                  courseId={course.id}
                  title={course.title}
                  price={course.price}
                  discountedPrice={course.discountedPrice || undefined}
                  imageUrl={course.imageUrl || undefined}
                  instructor={{ name: course.instructor.name || 'Unknown' }}
                  category={course.category}
                  level={course.level}
                  _count={course._count}
                />
              </div>

              {/* Share Button */}
              <div className="mt-4">
                <ShareButton
                  courseId={course.id}
                  courseTitle={course.title}
                />
              </div>


              <div className="mt-6 pt-6 border-t border-orange-500/20">
                <h3 className="font-semibold text-white mb-3">
                  Bu kurs şunları içerir:
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {course._count.lessons} video ders
                  </li>

                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Tamamlama sertifikası
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Mobil ve masaüstü erişim
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-black">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Sosyal</span>
          </Link>
          <Link href="/chef-sor" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef&apos;e Sor</span>
          </Link>
        </div>
      </div>

      <AIAssistantWidget />
    </div >
  )
}
