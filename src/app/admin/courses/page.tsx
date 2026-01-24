import { prisma } from "@/lib/prisma"
import CourseManagement from "./CourseManagement"

export const dynamic = 'force-dynamic'

async function getAllCourses() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      category: {
        select: {
          name: true,
          id: true
        }
      },
      lessons: {
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          duration: true,
          order: true,
          isFree: true
        },
        orderBy: {
          order: 'asc'
        }
      },
      reviews: {
        select: {
          rating: true
        }
      },
      _count: {
        select: {
          enrollments: true,
          lessons: true,
          reviews: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return courses
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  return categories
}

async function getInstructors() {
  const instructors = await prisma.user.findMany({
    where: {
      role: 'INSTRUCTOR'
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return instructors
}

export default async function CoursesPage() {
  const [courses, categories, instructors] = await Promise.all([
    prisma.course.findMany({
      include: {
        instructor: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true } },
        lessons: { select: { id: true, title: true, videoUrl: true, description: true, duration: true, order: true } },
        _count: { select: { enrollments: true, lessons: true, reviews: true } },
        reviews: { select: { rating: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.category.findMany(),
    prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      select: { id: true, name: true, email: true, image: true }
    })
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-white">Kurs Yönetimi</h1>
        <p className="text-gray-400">Kursları, dersleri ve abonelik erişimlerini buradan yönetebilirsiniz.</p>
      </div>

      <CourseManagement
        initialCourses={courses as any}
        categories={categories}
        instructors={instructors}
      />
    </div>
  )
}
