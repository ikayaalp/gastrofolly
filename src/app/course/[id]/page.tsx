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
  Zap,
  Award,
  Monitor,
  Smartphone,
  GraduationCap,
  BarChart3,
  ArrowRight,
  Sparkles,
  Shield,
  ChevronRight
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

    if (user?.subscriptionPlan && (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) > new Date())) {
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

  // Level label & color
  const levelLabel = course.level === 'BEGINNER' ? 'Başlangıç' : course.level === 'INTERMEDIATE' ? 'Orta Seviye' : 'İleri Seviye'
  const levelColor = course.level === 'BEGINNER' ? 'emerald' : course.level === 'INTERMEDIATE' ? 'amber' : 'rose'

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
              <Link href="/home" className="flex items-center gap-0.5">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt="C"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-orange-500" style={{ marginLeft: "-6px" }}>ulin</span><span className="text-white" style={{ marginLeft: "0px" }}>ora</span>
                </span>
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
                  <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">
                    Culi
                  </Link>
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



      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO SECTION — Full-width cinematic banner */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative w-full pt-16 md:pt-20">
        {/* Hero Image */}
        <div className="relative w-full h-[50vh] md:h-[55vh] overflow-hidden">
          {course.imageUrl ? (
            <Image
              src={course.imageUrl}
              alt={course.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-700 via-orange-900 to-black flex items-center justify-center">
              <ChefHat className="h-32 w-32 text-white/20" />
            </div>
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-0">
            <div className="max-w-7xl mx-auto md:px-8 pb-8">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-xs md:text-sm mb-4">
                <Link href="/home" className="text-gray-400 hover:text-orange-400 transition-colors">
                  Ana Sayfa
                </Link>
                <ChevronRight className="h-3 w-3 text-gray-600" />
                {course.category && (
                  <>
                    <span className="text-gray-400">{course.category.name}</span>
                    <ChevronRight className="h-3 w-3 text-gray-600" />
                  </>
                )}
                <span className="text-orange-400 truncate max-w-[200px] md:max-w-none">{course.title}</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Level Badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                  levelColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  levelColor === 'amber' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  <BarChart3 className="h-3 w-3" />
                  {levelLabel}
                </span>
                {/* Category Badge */}
                {course.category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-300 border border-white/10 backdrop-blur-sm">
                    {course.category.name}
                  </span>
                )}
                {/* Enrolled Badge */}
                {isEnrolled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 backdrop-blur-sm">
                    <CheckCircle className="h-3 w-3" />
                    Kayıtlı
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 leading-tight max-w-3xl">
                {course.title}
              </h1>

              {/* Description (hidden on mobile, shown after hero on mobile) */}
              <p className="hidden md:block text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl mb-6">
                {course.description}
              </p>

              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                {/* Instructor */}
                <Link href={`/instructor/${course.instructor.id}`} className="flex items-center gap-2 group">
                  <div className="relative">
                    <img
                      src={course.instructor.image || "/api/placeholder/40/40"}
                      alt={course.instructor.name || "Eğitmen"}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-orange-500/50 group-hover:border-orange-500 transition-colors object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold group-hover:text-orange-400 transition-colors">
                      {course.instructor.name}
                    </p>
                    <p className="text-gray-500 text-xs">Eğitmen</p>
                  </div>
                </Link>

                {/* Divider */}
                <div className="h-8 w-px bg-white/10 hidden md:block" />

                {/* Rating */}
                {averageRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(averageRating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-amber-400 font-semibold text-sm">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-500 text-xs">({course._count.reviews})</span>
                  </div>
                )}

                {/* Divider */}
                <div className="h-8 w-px bg-white/10 hidden md:block" />

                {/* Students Count */}
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{course._count.enrollments} öğrenci</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STATS BAR — Floating glass bar (desktop) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 -mt-6 md:-mt-8 mb-8">
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-0 md:flex md:items-center md:justify-around bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 md:py-5 md:px-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <Play className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
              <span className="text-xl md:text-2xl font-bold text-white">{course._count.lessons}</span>
            </div>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Ders</span>
          </div>

          <div className="hidden md:block h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
              <span className="text-xl md:text-2xl font-bold text-white">
                {totalDuration >= 60 ? `${Math.floor(totalDuration / 60)} saat` : `${totalDuration} dk`}
              </span>
            </div>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Toplam Süre</span>
          </div>

          <div className="hidden md:block h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
              <span className="text-xl md:text-2xl font-bold text-white">{course._count.enrollments}</span>
            </div>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Öğrenci</span>
          </div>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOBILE DESCRIPTION  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="md:hidden px-4 mb-6">
        <p className="text-gray-400 text-sm leading-relaxed">
          {course.description}
        </p>
      </div>


      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT + SIDEBAR */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-32 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── LEFT: Main Content ─── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Mobile CTA */}
            <div className="block lg:hidden space-y-4">
              {isEnrolled ? (
                <Link
                  href={`/learn/${course.id}`}
                  className={`group w-full text-white py-4 px-6 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-base ${hasProgress
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-600/20'
                    : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-600/20'
                    }`}
                >
                  {hasProgress ? (
                    <>
                      <Play className="h-5 w-5" />
                      Kursa Devam Et
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Kursa Başla
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Link>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-950/40 via-black to-orange-950/20 p-6">
                  {/* Glow effect */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 mb-4 shadow-lg shadow-orange-500/20">
                      <Crown className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Premium Üyelik Gerekli</h3>
                    <p className="text-gray-400 mb-4 text-sm">Tüm kurslara sınırsız erişim.</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">299 ₺</span>
                      <span className="text-sm text-gray-500 ml-1">/ Aylık</span>
                    </div>
                    <Link
                      href="/subscription?plan=Premium"
                      className="group w-full text-white py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-600/20"
                    >
                      <Sparkles className="h-4 w-4" />
                      Premium Ol
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
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
                <ShareButton
                  courseId={course.id}
                  courseTitle={course.title}
                />
              </div>
            </div>


            {/* ─── COURSE CONTENT (LESSONS) ─── */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              {/* Section Header */}
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-white">Kurs İçeriği</h2>
                    <p className="text-xs text-gray-500">{course._count.lessons} ders &middot; {totalDuration >= 60 ? `${Math.floor(totalDuration / 60)} saat ${totalDuration % 60} dk` : `${totalDuration} dk`}</p>
                  </div>
                </div>
              </div>

              {/* Lessons List */}
              <div className="divide-y divide-white/[0.04]">
                {course.lessons.map((lesson: { id: string; isFree?: boolean | null; duration?: number | null; title: string; description?: string | null }, index: number) => {
                  // İlk ders her zaman erişilebilir
                  const isFirstLesson = index === 0
                  const canAccess = isEnrolled || isFirstLesson

                  const lessonContent = (
                    <div
                      className={`group flex items-center gap-4 px-6 py-4 transition-all duration-200 ${canAccess ? 'hover:bg-white/[0.04] cursor-pointer' : 'opacity-60'}`}
                    >
                      {/* Lesson Number */}
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                        canAccess
                          ? 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20'
                          : 'bg-white/[0.04] text-gray-600'
                      }`}>
                        {canAccess ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                            Ders {index + 1}
                          </span>
                          {/* Badges */}
                          {isFirstLesson && !isEnrolled && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                              <Play className="h-2.5 w-2.5" />
                              Ücretsiz Önizleme
                            </span>
                          )}
                          {!isFirstLesson && lesson.isFree && !isEnrolled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                              Ücretsiz
                            </span>
                          )}
                          {!canAccess && !lesson.isFree && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              <Crown className="h-2.5 w-2.5" />
                              Premium
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm md:text-base font-medium text-white mt-0.5 truncate group-hover:text-orange-300 transition-colors">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="hidden md:block text-xs text-gray-500 mt-1 line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      {lesson.duration && (
                        <div className="shrink-0 flex items-center gap-1 text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{lesson.duration} dk</span>
                        </div>
                      )}

                      {/* Arrow */}
                      {canAccess && (
                        <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-orange-400 transition-colors shrink-0" />
                      )}
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


          {/* ─── RIGHT: Sidebar ─── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* CTA Card */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                {isEnrolled ? (
                  <div className="p-6">
                    <Link
                      href={`/learn/${course.id}`}
                      className={`group w-full text-white py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${hasProgress
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-600/20'
                        : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-600/20'
                        }`}
                    >
                      {hasProgress ? (
                        <>
                          <Play className="h-5 w-5" />
                          Kursa Devam Et
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Kursa Başla
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Link>
                  </div>
                ) : (
                  <div className="relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/8 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl" />

                    <div className="relative p-6 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 mb-5 shadow-lg shadow-orange-500/20">
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">Premium Üyelik</h3>
                      <p className="text-gray-400 mb-5 text-sm">Tüm kurslara sınırsız erişim kazanın.</p>
                      <div className="mb-5">
                        <span className="text-4xl font-bold text-white">299 ₺</span>
                        <span className="text-sm text-gray-500 ml-1">/ Aylık</span>
                      </div>
                      <Link
                        href="/subscription?plan=Premium"
                        className="group w-full text-white py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-600/20"
                      >
                        <Sparkles className="h-4 w-4" />
                        Premium Ol
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
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
                <ShareButton
                  courseId={course.id}
                  courseTitle={course.title}
                />
              </div>

              {/* Course Includes */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Bu Kurs İçerir</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Play className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <span>{course._count.lessons} video ders</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Clock className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <span>{totalDuration >= 60 ? `${Math.floor(totalDuration / 60)} saat ${totalDuration % 60} dk` : `${totalDuration} dk`} içerik</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Award className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <span>Tamamlama sertifikası</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Monitor className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <span>Masaüstü & mobil erişim</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Shield className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <span>Ömür boyu erişim</span>
                  </li>
                </ul>
              </div>

              {/* Instructor Mini Card */}
              <Link href={`/instructor/${course.instructor.id}`} className="block group">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-orange-500/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={course.instructor.image || "/api/placeholder/48/48"}
                      alt={course.instructor.name || "Eğitmen"}
                      className="w-12 h-12 rounded-xl border border-white/10 group-hover:border-orange-500/30 transition-colors object-cover"
                    />
                    <div>
                      <p className="text-white font-semibold group-hover:text-orange-400 transition-colors text-sm">
                        {course.instructor.name}
                      </p>
                      <p className="text-xs text-gray-500">Eğitmen Profili →</p>
                    </div>
                  </div>
                </div>
              </Link>
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
