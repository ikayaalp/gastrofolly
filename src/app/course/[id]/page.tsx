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
  Play,
  CheckCircle,
  Lock,
  Home,
  BookOpen,
  MessageCircle,
  Crown,
  Users,
  Award,
  Monitor,
  Smartphone,
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
  let userSubscriptionLevel = 0

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, subscriptionEndDate: true }
    })

    if (user?.subscriptionPlan && (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) > new Date())) {
      hasActiveSubscription = true
      if (user.subscriptionPlan === 'Premium') userSubscriptionLevel = 99
      else if (user.subscriptionPlan === 'Commis') userSubscriptionLevel = 1
      else if (user.subscriptionPlan === 'Chef D party') userSubscriptionLevel = 2
      else if (user.subscriptionPlan === 'Executive') userSubscriptionLevel = 3
    }
  }

  const courseLevelValue = course.level === 'BEGINNER' ? 1 : course.level === 'INTERMEDIATE' ? 2 : 3

  const isEnrolled = session?.user?.id
    ? course.enrollments.some((enrollment: { userId: string }) => enrollment.userId === session.user.id) ||
    (hasActiveSubscription && userSubscriptionLevel >= courseLevelValue)
    : false

  const averageRating = course.reviews.length > 0
    ? course.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / course.reviews.length
    : 0

  const totalDuration = course.lessons.reduce((acc: number, lesson: { duration: number | null }) => acc + (lesson.duration || 0), 0)

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

  const levelLabel = course.level === 'BEGINNER' ? 'Başlangıç' : course.level === 'INTERMEDIATE' ? 'Orta Seviye' : 'İleri Seviye'

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

  const totalHours = Math.floor(totalDuration / 60)
  const totalMins = totalDuration % 60
  const durationText = totalHours > 0 ? `${totalHours} saat ${totalMins > 0 ? `${totalMins} dk` : ''}` : `${totalDuration} dk`

  return (
    <div className="min-h-screen bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══ HEADER (Desktop) ═══ */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center gap-0.5">
                <div className="relative w-10 h-10">
                  <Image src="/logo.png" alt="C" fill className="object-contain" />
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
                  <Link href="/home" className="text-gray-300 hover:text-white transition-colors">Ana Sayfa</Link>
                  <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">Kurslarım</Link>
                  {session.user.role === 'ADMIN' && (
                    <>
                      <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">Admin Paneli</Link>
                      <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">Kurs Yönetimi</Link>
                    </>
                  )}
                  <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">Culi</Link>
                  <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">Chef Sosyal</Link>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">İletişim</Link>
                </nav>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <UserDropdown />
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-300 hover:text-orange-500">Giriş Yap</Link>
                  <Link href="/auth/signup" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">Kayıt Ol</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ HEADER (Mobile) ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center gap-0.5">
            <div className="relative w-8 h-8">
              <Image src="/logo.png" alt="C" fill className="object-contain" />
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
              <Link href="/auth/signin" className="text-gray-300 hover:text-orange-500 text-sm">Giriş Yap</Link>
            )}
          </div>
        </div>
      </div>



      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO — Neoskola-style cinematic full-width hero             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[70vh] md:min-h-[80vh] flex items-end pt-20 md:pt-24 overflow-hidden">
        {/* Background Image — full bleed */}
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
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-black to-black" />
        )}

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Content overlay */}
        <div className="relative z-10 w-full pb-12 md:pb-16">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
              <Link href="/home" className="hover:text-white transition-colors">Ana Sayfa</Link>
              <ChevronRight className="h-3 w-3 text-gray-600" />
              {course.category && (
                <>
                  <span>{course.category.name}</span>
                  <ChevronRight className="h-3 w-3 text-gray-600" />
                </>
              )}
              <span className="text-gray-300 truncate">{course.title}</span>
            </nav>

            <div className="max-w-2xl">
              {/* Category + Level */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                {course.category && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    {course.category.name}
                  </span>
                )}
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                  {levelLabel}
                </span>
              </div>

              {/* Instructor Name — large, like Neoskola */}
              <Link href={`/instructor/${course.instructor.id}`} className="inline-flex items-center gap-3 group mb-4">
                <img
                  src={course.instructor.image || "/api/placeholder/48/48"}
                  alt={course.instructor.name || "Eğitmen"}
                  className="w-12 h-12 rounded-full border-2 border-white/20 group-hover:border-orange-500/50 transition-colors object-cover"
                />
                <div>
                  <p className="text-white text-lg md:text-xl font-bold group-hover:text-orange-400 transition-colors">
                    {course.instructor.name}
                  </p>
                  <p className="text-gray-500 text-xs">Eğitmen</p>
                </div>
              </Link>

              {/* Title — hero-sized */}
              <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] mb-5">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8 max-w-lg">
                {course.description}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-orange-500" />
                  <span><span className="text-white font-semibold">{course._count.lessons}</span> Ders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-white font-semibold">{durationText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT + SIDEBAR                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14 pb-32 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

          {/* ─── LEFT: Main ─── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Mobile CTA */}
            <div className="block lg:hidden">
              {isEnrolled ? (
                <Link
                  href={`/learn/${course.id}`}
                  className={`group w-full text-white py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${hasProgress
                    ? 'bg-green-600 hover:bg-green-500'
                    : 'bg-orange-600 hover:bg-orange-500'
                    }`}
                >
                  <Play className="h-5 w-5" />
                  {hasProgress ? 'Kursa Devam Et' : 'Kursa Başla'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-[#111] p-6 text-center">
                  <Crown className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">Premium Üyelik Gerekli</h3>
                  <p className="text-gray-500 text-sm mb-4">Bu kursa erişmek için abone olun.</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">299 ₺</span>
                    <span className="text-sm text-gray-500 ml-1">/ Aylık</span>
                  </div>
                  <Link
                    href="/subscription?plan=Premium"
                    className="group w-full text-white py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500"
                  >
                    Premium Ol
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
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
                <ShareButton courseId={course.id} courseTitle={course.title} />
              </div>
            </div>


            {/* ─── CURRICULUM ─── */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Müfredat</h2>
              <p className="text-sm text-gray-500 mb-6">{course._count.lessons} ders &middot; {durationText} toplam süre</p>

              <div className="space-y-2">
                {course.lessons.map((lesson: { id: string; isFree?: boolean | null; duration?: number | null; title: string; description?: string | null }, index: number) => {
                  const isFirstLesson = index === 0
                  const canAccess = isEnrolled || isFirstLesson

                  const lessonContent = (
                    <div className={`group flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 ${
                      canAccess
                        ? 'border-white/[0.06] hover:border-orange-500/30 hover:bg-white/[0.02] cursor-pointer'
                        : 'border-white/[0.04] opacity-50'
                    }`}>
                      {/* Number */}
                      <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        canAccess ? 'bg-orange-500/10 text-orange-400' : 'bg-white/[0.04] text-gray-600'
                      }`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate group-hover:text-orange-300 transition-colors">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="hidden md:block text-xs text-gray-600 mt-0.5 truncate">{lesson.description}</p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {isFirstLesson && !isEnrolled && (
                          <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                            Önizleme
                          </span>
                        )}
                        {!isFirstLesson && lesson.isFree && !isEnrolled && (
                          <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                            Ücretsiz
                          </span>
                        )}
                        {!canAccess && !lesson.isFree && (
                          <Lock className="h-3.5 w-3.5 text-gray-600" />
                        )}
                      </div>

                      {/* Duration */}
                      {lesson.duration && (
                        <span className="shrink-0 text-xs text-gray-600 tabular-nums">{lesson.duration} dk</span>
                      )}
                    </div>
                  )

                  if (isEnrolled) {
                    return (
                      <Link key={lesson.id} href={`/learn/${course.id}?lesson=${lesson.id}`}>
                        {lessonContent}
                      </Link>
                    )
                  }

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

                  return <div key={lesson.id}>{lessonContent}</div>
                })}
              </div>
            </section>

            {/* Yorumlar Bölümü Kaldırıldı */}
          </div>


          {/* ─── RIGHT: Sidebar ─── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* CTA Card */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-6">
                {isEnrolled ? (
                  <Link
                    href={`/learn/${course.id}`}
                    className={`group w-full text-white py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${hasProgress
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-orange-600 hover:bg-orange-500'
                      }`}
                  >
                    <Play className="h-5 w-5" />
                    {hasProgress ? 'Kursa Devam Et' : 'Kursa Başla'}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <div className="text-center mb-5">
                      <Crown className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-white mb-1">Premium Üyelik</h3>
                      <p className="text-gray-500 text-sm mb-4">Tüm kurslara sınırsız erişim.</p>
                      <div className="mb-5">
                        <span className="text-3xl font-bold text-white">299 ₺</span>
                        <span className="text-sm text-gray-500 ml-1">/ Aylık</span>
                      </div>
                    </div>
                    <Link
                      href="/subscription?plan=Premium"
                      className="group w-full text-white py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500"
                    >
                      Premium Ol
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </>
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
                <ShareButton courseId={course.id} courseTitle={course.title} />
              </div>

              {/* Course Includes */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-5">
                <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-widest">Bu Kurs İçerir</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <Play className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>{course._count.lessons} video ders</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>{durationText} içerik</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <Award className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>Tamamlama sertifikası</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <Monitor className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>Masaüstü & mobil erişim</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-400">
                    <Shield className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>Ömür boyu erişim</span>
                  </li>
                </ul>
              </div>

              {/* Instructor Card */}
              <Link href={`/instructor/${course.instructor.id}`} className="block group">
                <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-5 hover:border-orange-500/20 transition-colors">
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">Eğitmen</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={course.instructor.image || "/api/placeholder/48/48"}
                      alt={course.instructor.name || "Eğitmen"}
                      className="w-12 h-12 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <p className="text-white font-semibold text-sm group-hover:text-orange-400 transition-colors">
                        {course.instructor.name}
                      </p>
                      <p className="text-xs text-gray-500">Profili Görüntüle →</p>
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
    </div>
  )
}
