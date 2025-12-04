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
  BookOpen,
  Home,
  MessageCircle
} from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import InstructorShareButton from "@/components/instructor/InstructorShareButton"

interface InstructorPageProps {
  params: Promise<{
    id: string
  }>
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
    (acc: number, course: typeof instructor.createdCourses[0]) => acc + course._count.enrollments,
    0
  )

  const totalReviews = instructor.createdCourses.reduce(
    (acc: number, course: typeof instructor.createdCourses[0]) => acc + course._count.reviews,
    0
  )

  const averageRating = totalReviews > 0 && instructor.createdCourses.length > 0
    ? instructor.createdCourses.reduce((acc: number) => {
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
                <Link href="/chef-sor" className="text-gray-300 hover:text-white transition-colors">
                  Chef&apos;e Sor
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
              <div className="bg-black border border-gray-800 rounded-xl p-6 sticky top-24 shadow-xl shadow-orange-900/5">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    {instructor.image ? (
                      <Image
                        src={instructor.image}
                        alt={instructor.name || "Eğitmen"}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-2 border-orange-500/50"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center border-2 border-orange-500/50">
                        <ChefHat className="h-12 w-12 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-black rounded-full p-1 border border-gray-800">
                      <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-white mb-1">
                    {instructor.name}
                  </h1>

                  <p className="text-orange-500 text-sm font-medium mb-4">Profesyonel Eğitmen</p>

                  {averageRating > 0 && (
                    <div className="flex items-center justify-center mb-6 bg-gray-900/50 py-2 rounded-lg border border-gray-800">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1.5" />
                      <span className="font-bold text-white mr-1">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({totalReviews} değerlendirme)
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-center mb-6">
                    <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-800">
                      <div className="text-xl font-bold text-white mb-1">
                        {instructor._count.createdCourses}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Kurs</div>
                    </div>
                    <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-800">
                      <div className="text-xl font-bold text-white mb-1">
                        {totalStudents}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Öğrenci</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <InstructorShareButton
                      instructorId={instructor.id}
                      instructorName={instructor.name || 'Unknown'}
                    />
                    <Link
                      href="/chef-sor"
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-orange-500/50"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>Chef&apos;e Sor</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div className="bg-black border border-gray-800 rounded-xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-500/10 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Hakkında</h2>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {instructor.name} deneyimli bir eğitmen olarak gastronomi dünyasında önemli bir yer edinmiştir.
                    Profesyonel mutfak deneyimi ve öğretme tutkusu ile öğrencilerine en iyi eğitimi sunmaktadır.
                  </p>
                  <p className="text-gray-400 leading-relaxed mt-4">
                    Uzmanlık alanları arasında modern mutfak teknikleri, geleneksel yemek kültürü ve
                    yaratıcı sunum teknikleri bulunmaktadır. Öğrencilerinin başarısı için sürekli
                    kendini geliştiren ve güncel teknikleri takip eden bir eğitmendir.
                  </p>
                </div>
              </div>

              {/* Courses Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg">
                      <BookOpen className="h-6 w-6 text-orange-500" />
                    </div>
                    Yayınlanan Kurslar
                  </h2>
                  <span className="text-gray-500 text-sm">{instructor.createdCourses.length} kurs</span>
                </div>

                {instructor.createdCourses.length === 0 ? (
                  <div className="bg-black border border-gray-800 rounded-xl p-12 text-center">
                    <div className="bg-gray-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-10 w-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Henüz Kurs Yok
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Bu eğitmen henüz kurs yayınlamamış. Takipte kalın!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {instructor.createdCourses.map((course: typeof instructor.createdCourses[0]) => (
                      <Link
                        key={course.id}
                        href={`/course/${course.id}`}
                        className="group block"
                      >
                        <div className="bg-black border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 h-full flex flex-col">
                          {/* Course Image */}
                          <div className="relative h-48 overflow-hidden">
                            {course.imageUrl ? (
                              <Image
                                src={course.imageUrl}
                                alt={course.title}
                                width={400}
                                height={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized={true}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-orange-900 to-black flex items-center justify-center">
                                <ChefHat className="h-12 w-12 text-orange-500/50" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                            <div className="absolute top-3 left-3">
                              <span className="bg-black/60 backdrop-blur-md text-white border border-white/10 px-3 py-1 rounded-full text-xs font-medium">
                                {course.category.name}
                              </span>
                            </div>
                          </div>

                          {/* Course Info */}
                          <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                              {course.title}
                            </h3>

                            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                              <div className="flex items-center">
                                <Play className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                                {course._count.lessons} Ders
                              </div>
                              <div className="flex items-center">
                                <Users className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                                {course._count.enrollments}
                              </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-800 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {/* Fiyat bilgisi kaldırıldı */}
                              </div>

                              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                                <Play className="h-4 w-4 text-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
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
          <Link href="/chef-sor" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Chef&apos;e Sor</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
