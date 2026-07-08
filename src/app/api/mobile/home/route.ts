import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveHomeSections } from "@/lib/homeSections"

export async function GET(req: Request) {
  try {
    const [
      featuredCourses,
      popularCourses,
      categories,
      rawInstructors,
      homeCovers,
      homeInstructors,
      homeSectionsRaw
    ] = await Promise.all([
      prisma.course.findMany({
        where: { isPublished: true },
        include: {
          instructor: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true, lessons: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),
      prisma.course.findMany({
        where: { isPublished: true },
        include: {
          instructor: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true, lessons: true } }
        },
        orderBy: { enrollments: { _count: 'desc' } },
        take: 6
      }),
      prisma.category.findMany({
        include: {
          courses: {
            where: { isPublished: true },
            include: {
              instructor: { select: { id: true, name: true, image: true } },
              category: { select: { id: true, name: true, slug: true } },
              reviews: { select: { rating: true } },
              _count: { select: { enrollments: true, lessons: true } }
            },
            take: 6,
            orderBy: { createdAt: 'desc' }
          },
          _count: { select: { courses: true } }
        }
      }),
      prisma.user.findMany({
        where: { role: "INSTRUCTOR" },
        select: {
          id: true,
          name: true,
          image: true,
          createdCourses: {
            select: {
              id: true,
              enrollments: { select: { id: true } },
              reviews: { select: { rating: true } },
            }
          }
        }
      }),
      prisma.homeCover.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
      }),
      prisma.homeInstructor.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
      }),
      prisma.homeSection.findMany({
        include: {
          courses: {
            where: { course: { isPublished: true } },
            orderBy: { order: "asc" },
            include: {
              course: {
                include: {
                  instructor: { select: { id: true, name: true, image: true } },
                  category: { select: { id: true, name: true, slug: true } },
                  reviews: { select: { rating: true } },
                  _count: { select: { enrollments: true, lessons: true } }
                }
              }
            }
          }
        }
      })
    ])

    const homeSections = resolveHomeSections(homeSectionsRaw)

    const instructors = rawInstructors.map((chef: any) => {
      let totalStudents = 0
      let totalRating = 0
      let reviewCount = 0

      chef.createdCourses.forEach((course: any) => {
        totalStudents += course.enrollments.length
        course.reviews.forEach((review: any) => {
          totalRating += review.rating
          reviewCount++
        })
      })

      const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : "0.0"

      return {
        id: chef.id,
        name: chef.name || "İsimsiz Şef",
        specialty: chef.createdCourses.length > 0 ? "Kıdemli Şef Eğitmeni" : "Eğitmen",
        rating: averageRating,
        courseCount: chef.createdCourses.length,
        image: chef.image,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        featuredCourses,
        popularCourses,
        recentCourses: featuredCourses, // Web ile tutarlı olması için
        categories,
        instructors,
        homeCovers,
        homeInstructors,
        homeSections
      }
    })
  } catch (error) {
    console.error("[MOBILE_HOME_GET]", error)
    return NextResponse.json(
      { success: false, error: "Anasayfa verileri getirilemedi" },
      { status: 500 }
    )
  }
}
