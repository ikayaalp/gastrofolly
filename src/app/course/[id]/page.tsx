import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
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
  MessageCircle
} from "lucide-react"
import EnrollButton from "@/components/course/EnrollButton"
import FavoriteButton from "@/components/course/FavoriteButton"
import ShareButton from "@/components/course/ShareButton"
import CommentsSection from "@/components/course/CommentsSection"
import UserDropdown from "@/components/ui/UserDropdown"

interface CoursePageProps {
  params: {
    id: string
  }
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

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await getServerSession(authOptions)
  const { id } = params
  
  
  const course = await getCourse(id)

  if (!course) {
    notFound()
  }

  const isEnrolled = session?.user?.id 
    ? course.enrollments.some((enrollment: { userId: string }) => enrollment.userId === session.user.id)
    : false

  const averageRating = course.reviews.length > 0
    ? course.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / course.reviews.length
    : 0

  const totalDuration = course.lessons.reduce((acc: number, lesson: { duration: number | null }) => acc + (lesson.duration || 0), 0)

  return (
    <div className="min-h-screen bg-black">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
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
                  <Link href="/chef-sor" className="text-gray-300 hover:text-white transition-colors">
                    Mesajlar
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
            {session?.user?.role === 'ADMIN' && (
              <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">Admin</span>
            )}
          </Link>
          <div className="flex items-center space-x-3">
            {session?.user ? (
              <UserDropdown />
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
      <div className="bg-gray-900/30 border-b border-gray-800 pt-20 md:pt-24">
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
              {course.imageUrl ? (
                <img
                  src={course.imageUrl}
                  alt={course.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <ChefHat className="h-24 w-24 text-white" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-sm font-semibold">
                    {course.category.name}
                  </span>
                  <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                    {course.level}
                  </span>
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
                  
                  {averageRating > 0 && (
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                      <span className="font-semibold text-white">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-400 ml-1">
                        ({course._count.reviews} değerlendirme)
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center border-t pt-6">
                  <div>
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {course._count.enrollments}
                    </p>
                    <p className="text-sm text-gray-400">Öğrenci</p>
                  </div>
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Kurs İçeriği</h2>
              <div className="space-y-4">
                {course.lessons.map((lesson: { id: string; isFree?: boolean | null; duration?: number | null; title: string; description?: string | null }, index: number) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:border-orange-500/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-orange-500/20 text-orange-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                        {index + 1}
                      </div>
                      <div className="flex items-center">
                        {lesson.isFree ? (
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
                      {lesson.isFree ? (
                        <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-semibold">
                          Ücretsiz
                        </span>
                      ) : (
                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yorumlar Bölümü */}
            <CommentsSection 
              reviews={course.reviews} 
              courseId={course.id}
              canComment={false}
              userId={session?.user?.id}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              <div className="text-center mb-6">
                {course.discountedPrice && course.discountRate ? (
                  <>
                    <div className="mb-2">
                      <p className="text-3xl font-bold text-green-400 mb-1">
                        ₺{course.discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-lg text-gray-400 line-through">
                          ₺{course.price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                          %{course.discountRate.toFixed(0)} İNDİRİM
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400">Tek seferlik ödeme</p>
                    <p className="text-sm text-orange-400 mt-1">
                      ₺{(course.price - course.discountedPrice).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} tasarruf edin!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-orange-500 mb-2">
                      ₺{course.price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-gray-400">Tek seferlik ödeme</p>
                  </>
                )}
              </div>

              {isEnrolled ? (
                <Link
                  href={`/learn/${course.id}`}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Kursa Devam Et
                </Link>
              ) : (
                <EnrollButton 
                  courseId={course.id} 
                  price={course.price}
                  discountedPrice={course.discountedPrice || undefined}
                  title={course.title}
                  imageUrl={course.imageUrl || undefined}
                  instructor={{ name: course.instructor.name || 'Unknown' }}
                />
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

              <div className="mt-6 space-y-4 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Seviye:</span>
                  <span className="font-semibold text-white">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ders Sayısı:</span>
                  <span className="font-semibold text-white">{course._count.lessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Toplam Süre:</span>
                  <span className="font-semibold text-white">
                    {Math.round(totalDuration / 60)} saat
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sertifika:</span>
                  <span className="font-semibold text-white">Evet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Yaşam Boyu Erişim:</span>
                  <span className="font-semibold text-white">Evet</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
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
                    Yaşam boyu erişim
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
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
