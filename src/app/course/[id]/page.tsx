import { notFound } from "next/navigation"
import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isPremiumUser } from "@/lib/subscription"
import Link from "next/link"
import Image from "next/image"
import {
  ChefHat,
  Clock,
  Play,
  Lock,
  Home,
  BookOpen,
  Crown,
  Sparkles,
  Users,
  Award,
  Monitor,
  Shield,
  ArrowRight,
  ChevronRight,
  Gift
} from "lucide-react"
import FavoriteButton from "@/components/course/FavoriteButton"
import { getOptimizedMediaUrl } from "@/lib/utils"
import ShareButton from "@/components/course/ShareButton"
import UserDropdown from "@/components/ui/UserDropdown"
import NotificationDropdown from "@/components/ui/NotificationDropdown"
import FreeLessonModal from "@/components/course/FreeLessonModal"

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
      _count: {
        select: {
          lessons: true,
          enrollments: true
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

  if (!course.isPublished) {
    const isInstructor = session?.user?.id === course.instructorId
    const isAdmin = session?.user?.role === 'ADMIN'

    if (!isInstructor && !isAdmin) {
      notFound()
    }
  }

  // Detay sayfası banner görseli: panelden ayrı ayarlanabilir, yoksa kart görseline düşer
  const bannerImage = course.detailImageUrl || course.imageUrl

  // Aktif abonelik (Premium), tüm kurslara erişim sağlar. Eskiden burada
  // Commis/Chef D Party/Executive gibi kademeli bir plan-seviye karşılaştırması
  // vardı; güncel sistemde tek plan (Premium) var ve erişim kontrolü diğer
  // her yerde (learn/[courseId]/page.tsx, api/enroll) zaten bu şekilde
  // yapılıyor — buradaki mantık ona eşitlendi.
  let hasActiveSubscription = false

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, subscriptionEndDate: true }
    })

    hasActiveSubscription = isPremiumUser(user)
  }

  const isEnrolled = session?.user?.id
    ? course.enrollments.some((enrollment: { userId: string }) => enrollment.userId === session.user.id) ||
    hasActiveSubscription
    : false

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

  const activePlan = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true, interval: 'monthly' }
  })
  const displayPrice = activePlan ? activePlan.price : 399

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

  // Description splitting for summary
  const summaryPoints = course.description
    ? course.description.split('. ').slice(0, 4).filter(s => s.length > 5)
    : ["Bu eğitimde yeni teknikler öğreneceksiniz."]

  return (
    <div className="min-h-screen bg-[#050505]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══ HEADER (Desktop) ═══ */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center gap-0.5 hover:opacity-80 transition-opacity">
                <div className="relative w-10 h-10">
                  <Image src="/logo.png" alt="C" fill className="object-contain" />
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-orange-600" style={{ marginLeft: "-6px" }}>ulin</span><span className="text-white" style={{ marginLeft: "0px" }}>ora</span>
                </span>
              </Link>
              {session?.user && (
                <nav className="hidden md:flex space-x-6">
                  <Link href="/home" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Ana Sayfa</Link>
                  <Link href="/my-courses" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Kurslarım</Link>
                  {session.user.role === 'ADMIN' && (
                    <Link href="/admin" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Admin Paneli</Link>
                  )}
                  <Link href="/culi" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Culi</Link>
                  <Link href="/chef-sosyal" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Chef Sosyal</Link>
                </nav>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <UserDropdown />
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-300 hover:text-orange-500 text-sm font-medium">Giriş Yap</Link>
                  <Link href="/auth/signup" className="bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20">Kayıt Ol</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ HEADER (Mobile) ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center gap-0.5">
            <div className="relative w-8 h-8">
              <Image src="/logo.png" alt="C" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-orange-600" style={{ marginLeft: "-6px" }}>ulin</span><span className="text-white" style={{ marginLeft: "0px" }}>ora</span>
            </span>
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
      {/* HERO — NEOSKOLA STYLE                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full bg-[#050505]">
        
        {/* Mobile Background Image */}
        <div className="md:hidden relative w-full aspect-video mt-14">
          {bannerImage ? (
            <Image
              src={getOptimizedMediaUrl(bannerImage)}
              alt={course.title}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f05] via-[#050505] to-[#050505] flex items-center justify-center">
               <ChefHat className="h-12 w-12 text-white/10" />
            </div>
          )}
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[#050505]" />
        </div>

        {/* Desktop Background & Content Wrapper */}
        <div className="relative w-full md:min-h-[85vh] flex items-center pt-8 md:pt-32 pb-16 overflow-hidden -mt-24 md:mt-0">
          
          {/* Desktop Background Image */}
          <div className="hidden md:block absolute inset-0">
            {course.imageUrl ? (
              <Image
                src={getOptimizedMediaUrl(course.imageUrl)}
                alt={course.title}
                fill
                priority
                className="object-cover object-center scale-105" // slight scale for cinematic feel
                sizes="100vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f05] via-[#050505] to-[#050505]" />
            )}
            {/* Cinematic Gradients to match screenshot */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
          </div>

          {/* Content layer */}
          <div className="relative z-10 w-full pt-16 md:pt-0">
            <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-end gap-10">
              
              {/* Left: Text Content */}
              <div className="w-full md:max-w-2xl text-center md:text-left">
                {/* Instructor Name First */}
                <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-medium text-white leading-tight mb-2 tracking-tight">
                  {course.instructor.name}
                </h1>
                
                {/* Course Title */}
                <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-300 mb-6 tracking-wide">
                  {course.title}
                </h2>
                
                {/* Badges row */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                  {course.category && (
                    <span className="bg-white/10 backdrop-blur-sm text-gray-200 text-xs font-semibold px-3 py-1.5 rounded uppercase tracking-wider">
                      {course.category.name}
                    </span>
                  )}
                  <span className="text-gray-400 text-sm tracking-wide">
                    {course._count.lessons} Ders • {course.lessons.length} Bölüm
                  </span>
                </div>
                
                {/* Description snippet */}
                <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-10 max-w-lg mx-auto md:mx-0 font-light">
                  {course.description?.substring(0, 180)}{course.description && course.description.length > 180 ? '...' : ''}
                </p>
                
                {/* Trailer Button */}
                <div className="flex items-center justify-center md:justify-start">
                  <FreeLessonModal 
                    lesson={course.lessons[0]}
                    courseTitle={course.title}
                    customTrigger={
                      <button className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg flex items-center gap-3 transition-all shadow-lg shadow-orange-600/20 group">
                        <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold tracking-wide">Kurs tanıtımı</span>
                      </button>
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Absolute Premium CTA (Bottom Right of Hero) */}
          {!isEnrolled && (
            <div className="absolute bottom-16 right-12 lg:right-24 z-20 hidden md:block">
              <div className="bg-[#121212]/95 backdrop-blur-2xl rounded-3xl p-6 border border-orange-500/20 shadow-[0_0_50px_-12px_rgba(234,88,12,0.25)] w-80 transform hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-white font-bold text-base tracking-wide">Premium Ol</h3>
                    <p className="text-gray-400 text-xs">Tüm eğitimlere sınırsız erişim</p>
                  </div>
                </div>
                
                <div className="bg-[#1a1a1a] rounded-xl p-3 mb-4 border border-white/5 flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Aylık</span>
                  <span className="text-white font-bold text-lg">{displayPrice} ₺</span>
                </div>

                <Link href="/subscription?plan=Premium" className="block w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3.5 px-4 rounded-xl text-center transition-all text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.4)]">
                  Üyeliği Başlat
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MAIN GRID LAYOUT                                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* --- TOP ROW --- */}
          {/* Left: About Course */}
          <div className="lg:col-span-3 bg-black rounded-xl border border-white/10 overflow-hidden">
            <div className="bg-[#222] px-6 py-4">
              <h3 className="text-[15px] font-bold text-white tracking-widest uppercase">EĞİTİM HAKKINDA</h3>
            </div>
            <div className="p-6 md:p-8">
              <p className="text-gray-400 text-sm md:text-[15px] leading-relaxed font-light whitespace-pre-wrap">
                {course.description}
              </p>
            </div>
          </div>

          {/* --- MIDDLE ROW --- */}
          {/* Left: About Instructor */}
          <div className="lg:col-span-2 bg-black rounded-xl border border-white/10 overflow-hidden">
            <div className="bg-[#222] px-6 py-4">
              <h3 className="text-[15px] font-bold text-white tracking-widest uppercase">EĞİTMEN HAKKINDA</h3>
            </div>
            <div className="p-6 md:p-8">
              <p className="text-gray-400 text-sm md:text-[15px] leading-relaxed font-light">
                {course.instructor.bio || `${course.instructor.name} gastronomi dünyasında uzmanlaşmış ve tecrübelerini Culinora'da paylaşan değerli bir şeftir. Eğitimlerinde hem teorik hem pratik bilgilere yer verir.`}
              </p>
            </div>
          </div>

          {/* Right: Instructor Photo Card */}
          <Link href={`/instructor/${course.instructor.id}`} className="block lg:col-span-1 relative rounded-3xl overflow-hidden aspect-[4/3] border border-white/5 group">
            <Image 
              src={course.instructor.image || "/api/placeholder/400/300"} 
              alt={course.instructor.name || "Eğitmen"} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10 group-hover:border-orange-500/30 transition-colors">
              <div className="w-1 h-10 bg-orange-600 rounded-full" />
              <div>
                <p className="text-white font-bold text-[15px] group-hover:text-orange-400 transition-colors">{course.instructor.name}</p>
                <p className="text-gray-400 text-xs tracking-wide">Eğitmen Profili &rarr;</p>
              </div>
            </div>
          </Link>

          {/* --- BOTTOM ROW --- */}
          {/* Curriculum List */}
          <div className="lg:col-span-3 bg-black rounded-xl border border-white/10 overflow-hidden mt-2">
            <div className="bg-[#222] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-white tracking-widest uppercase">EĞİTİM İÇERİĞİ</h3>
            </div>
            
            <div className="divide-y divide-white/5">
              {course.lessons.map((lesson: { id: string; title: string; description: string | null; videoUrl: string | null; duration: number | null }, index: number) => {
                const isFirstLesson = index === 0;
                const canAccess = isEnrolled || isFirstLesson;
                
                const LessonContent = (
                  <div className={`p-4 md:p-8 flex flex-col sm:flex-row gap-4 md:gap-8 items-start sm:items-center transition-colors group ${canAccess ? 'cursor-pointer hover:bg-white/[0.04]' : 'hover:bg-white/[0.02] opacity-80'}`}>
                    <div className="flex flex-row items-center gap-4 flex-1 w-full min-w-0">
                      {/* Lesson Number */}
                      <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 flex items-center justify-center rounded-xl border border-white/5 transition-colors ${canAccess ? 'bg-orange-500/10 group-hover:bg-orange-500/20' : 'bg-white/5'}`}>
                         <span className={`text-xl md:text-2xl font-bold transition-colors ${canAccess ? 'text-orange-500' : 'text-gray-500'}`}>
                            {(index + 1).toString().padStart(2, '0')}
                         </span>
                      </div>
                      
                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-base md:text-lg mb-1 ${canAccess ? 'text-white group-hover:text-orange-400 transition-colors' : 'text-gray-300'} truncate md:whitespace-normal`}>Bölüm {index + 1} - {lesson.title}</h4>
                        {lesson.description && (
                          <p className="text-gray-500 text-xs md:text-sm line-clamp-1 md:line-clamp-2 leading-relaxed font-light">{lesson.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Lesson Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 shrink-0 mt-4 md:mt-0">
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium bg-white/5 px-3 py-1.5 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.duration || "0"}:00</span>
                      </div>
                      
                      {isEnrolled ? (
                        <div className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors w-full md:w-auto text-center">
                          İzle
                        </div>
                      ) : isFirstLesson ? (
                        <div className="bg-[#1a1a1a] border border-green-500/30 text-green-500 px-6 py-2.5 rounded-lg text-sm font-bold transition-all w-full md:w-auto text-center group-hover:bg-green-500/10 group-hover:border-green-500">
                          Ücretsiz İzle
                        </div>
                      ) : (
                        <div className="bg-[#1a1a1a] text-gray-500 px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-white/5 w-full md:w-auto cursor-not-allowed">
                          <Lock className="w-4 h-4" /> Kilitli
                        </div>
                      )}
                    </div>
                  </div>
                );

                if (isEnrolled) {
                  return (
                    <Link key={lesson.id} href={`/learn/${course.id}?lesson=${lesson.id}`} className="block">
                      {LessonContent}
                    </Link>
                  )
                }

                if (isFirstLesson) {
                  return (
                    <FreeLessonModal
                      key={lesson.id}
                      lesson={lesson}
                      courseTitle={course.title}
                      customTrigger={LessonContent}
                    />
                  )
                }

                return <div key={lesson.id}>{LessonContent}</div>;
              })}
            </div>
          </div>
        </div>
      </div>



      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 pb-safe">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-500 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-500 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-500 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-[10px] font-medium mt-1">Sosyal</span>
          </Link>
        </div>
      </div>



    </div>
  )
}
