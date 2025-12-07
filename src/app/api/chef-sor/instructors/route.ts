import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Kullanıcının kayıtlı olduğu kursları ve hocalarını getir
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: user.id
            },
            include: {
                course: {
                    include: {
                        instructor: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                }
            }
        })

        // Benzersiz hocaları çıkar ve kurslarını gruplandır
        const instructorsMap = new Map()

        enrollments.forEach((enrollment) => {
            const instructor = enrollment.course.instructor
            const course = {
                id: enrollment.course.id,
                title: enrollment.course.title,
                imageUrl: enrollment.course.imageUrl
            }

            if (instructorsMap.has(instructor.id)) {
                instructorsMap.get(instructor.id).courses.push(course)
            } else {
                instructorsMap.set(instructor.id, {
                    id: instructor.id,
                    name: instructor.name,
                    email: instructor.email,
                    image: instructor.image,
                    courses: [course]
                })
            }
        })

        const instructors = Array.from(instructorsMap.values())

        return NextResponse.json({ instructors })
    } catch (error) {
        console.error('Error fetching instructors:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

