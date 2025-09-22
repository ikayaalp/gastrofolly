import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log('Starting seed data creation...')
    
    // Kategoriler oluştur
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'temel-mutfak' },
        update: {},
        create: {
          name: 'Temel Mutfak',
          description: 'Mutfakta başarılı olmak için temel bilgiler',
          slug: 'temel-mutfak',
          imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'
        }
      }),
      prisma.category.upsert({
        where: { slug: 'turk-mutfagi' },
        update: {},
        create: {
          name: 'Türk Mutfağı',
          description: 'Türk mutfağının en sevilen lezzetleri',
          slug: 'turk-mutfagi',
          imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=500'
        }
      }),
      prisma.category.upsert({
        where: { slug: 'pastane' },
        update: {},
        create: {
          name: 'Pastane Sanatı',
          description: 'Pasta, kurabiye ve tatlı yapımı',
          slug: 'pastane',
          imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500'
        }
      })
    ])

    // Eğitmen kullanıcı oluştur
    const instructor = await prisma.user.upsert({
      where: { email: 'chef@example.com' },
      update: {},
      create: {
        name: 'Şef Mehmet Yılmaz',
        email: 'chef@example.com',
        role: 'INSTRUCTOR',
        image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200'
      }
    })

    // Admin kullanıcı oluştur
    const admin = await prisma.user.upsert({
      where: { email: 'admin@chef.com' },
      update: {},
      create: {
        name: 'Admin Kullanıcı',
        email: 'admin@chef.com',
        role: 'ADMIN',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
      }
    })

    // Örnek kurs oluştur
    const course = await prisma.course.upsert({
      where: { id: 'course-1' },
      update: {},
      create: {
        id: 'course-1',
        title: 'Temel Mutfak Teknikleri',
        description: 'Mutfakta başarılı olmak için bilmeniz gereken temel teknikleri öğrenin. Doğrama, pişirme yöntemleri ve temel soslar.',
        price: 299,
        level: 'BEGINNER',
        duration: 480,
        isPublished: true,
        instructorId: instructor.id,
        categoryId: categories[0].id,
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'
      }
    })

    // Örnek ders oluştur
    await prisma.lesson.create({
      data: {
        title: 'Mutfak Araçları ve Güvenlik',
        description: 'Mutfakta kullanacağınız temel araçlar ve güvenlik kuralları',
        duration: 45,
        order: 1,
        isFree: true,
        courseId: course.id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Seed data created successfully!',
      data: {
        categories: categories.length,
        instructors: 1,
        admin: 1,
        courses: 1,
        lessons: 1
      }
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
