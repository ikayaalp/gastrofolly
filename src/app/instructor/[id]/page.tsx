import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { 
  ChefHat, 
  Star, 
  Users, 
  Play, 
  Clock,
  BookOpen,
  Home,
  MessageCircle
} from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import InstructorShareButton from "@/components/instructor/InstructorShareButton"
import MessageButton from "@/components/instructor/MessageButton"

interface InstructorPageProps {
  params: {
    id: string
  }
}

async function getInstructor(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      createdCourses: {
        where: { isPublished: true },
        include: {
          category: true,
          _count: {
            select: {
              enrollments: true,
              lessons: true,
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          createdCourses: {
            where: { isPublished: true }
          }
        }
      }
    }
  })
}

export default async function InstructorPage({ params }: InstructorPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  const instructor = await getInstructor(id)

  if (!instructor) {
    notFound()
  }

  const totalStudents = instructor.createdCourses.reduce(
    (acc, course) => acc + course._count.enrollments, 
    0
  )

  const totalLessons = instructor.createdCourses.reduce(
    (acc, course) => acc + course._count.lessons, 
    0
  )

  const totalReviews = instructor.createdCourses.reduce(
    (acc, course) => acc + course._count.reviews, 
    0
  )

  const averageRating = totalReviews > 0 
    ? instructor.createdCourses.reduce((acc, course) => {
        // Burada gerçek rating hesaplaması yapılabilir
        return acc + 4.5 // Örnek değer
      }, 0) / instructor.createdCourses.length
    : 0

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
              <nav className="hidden md:flex space-x-6">
                <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
                <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurslarım
                </Link>
                <Link href="/favorites" className="text-gray-300 hover:text-white transition-colors">
                  Favorilerim
                </Link>
                {session?.user?.role === 'ADMIN' && (
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

      <div className="pt-16 md:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/home" className="text-gray-400 hover:text-orange-500">
                Ana Sayfa
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">Eğitmen</span>
              <span className="text-gray-600">/</span>
              <span className="text-orange-500">{instructor.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Instructor Info */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4">
                    {instructor.image ? (
                      <Image
                        src={instructor.image}
                        alt={instructor.name || "Eğitmen"}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center">
                        <ChefHat className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {instructor.name}
                  </h1>
                  
                  <p className="text-gray-400 mb-4">Eğitmen</p>

                  {averageRating > 0 && (
                    <div className="flex items-center justify-center mb-4">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                      <span className="font-semibold text-white">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-400 ml-1">
                        ({totalReviews} değerlendirme)
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-center mb-6">
                    <div>
                      <div className="text-2xl font-bold text-orange-500">
                        {instructor._count.createdCourses}
                      </div>
                      <div className="text-sm text-gray-400">Kurs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-500">
                        {totalStudents}
                      </div>
                      <div className="text-sm text-gray-400">Öğrenci</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <InstructorShareButton 
                      instructorId={instructor.id}
                      instructorName={instructor.name || 'Unknown'}
                    />
                    <MessageButton 
                      instructorId={instructor.id}
                      instructorName={instructor.name || 'Unknown'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Hakkında</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    {instructor.name} deneyimli bir eğitmen olarak gastronomi dünyasında önemli bir yer edinmiştir. 
                    Profesyonel mutfak deneyimi ve öğretme tutkusu ile öğrencilerine en iyi eğitimi sunmaktadır.
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    Uzmanlık alanları arasında modern mutfak teknikleri, geleneksel yemek kültürü ve 
                    yaratıcı sunum teknikleri bulunmaktadır. Öğrencilerinin başarısı için sürekli 
                    kendini geliştiren ve güncel teknikleri takip eden bir eğitmendir.
                  </p>
                </div>
              </div>

              {/* Courses Section */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Yayınlanan Kurslar
                </h2>
                
                {instructor.createdCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Henüz Kurs Yok
                    </h3>
                    <p className="text-gray-400">
                      Bu eğitmen henüz kurs yayınlamamış.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {instructor.createdCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-orange-500/50 transition-colors"
                      >
                        {/* Course Image */}
                        <div className="relative">
                          {course.imageUrl ? (
                            <Image
                              src={course.imageUrl}
                              alt={course.title}
                              width={400}
                              height={200}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                              <ChefHat className="h-16 w-16 text-white" />
                            </div>
                          )}
                          
                          <div className="absolute top-3 left-3">
                            <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs font-semibold">
                              {course.category.name}
                            </span>
                          </div>
                        </div>

                        {/* Course Info */}
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                            {course.title}
                          </h3>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center">
                                <Play className="h-4 w-4 mr-1" />
                                {course._count.lessons}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {course._count.enrollments}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {Math.round(Math.random() * 10 + 5)}h
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              {course.discountedPrice ? (
                                <>
                                  <span className="text-lg font-bold text-green-400">
                                    ₺{course.discountedPrice.toLocaleString('tr-TR')}
                                  </span>
                                  <span className="text-sm text-gray-400 line-through">
                                    ₺{course.price.toLocaleString('tr-TR')}
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-bold text-orange-500">
                                  ₺{course.price.toLocaleString('tr-TR')}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link
                            href={`/course/${course.id}`}
                            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
                          >
                            Kursa Git
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">İletişim</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
