import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log('Starting comprehensive seed data creation...')
    
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

    // Eğitmen kullanıcıları oluştur
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

    const instructor2 = await prisma.user.upsert({
      where: { email: 'chef2@example.com' },
      update: {},
      create: {
        name: 'Şef Ayşe Kaya',
        email: 'chef2@example.com',
        role: 'INSTRUCTOR',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200'
      }
    })

    const instructor3 = await prisma.user.upsert({
      where: { email: 'chef3@example.com' },
      update: {},
      create: {
        name: 'Şef Ahmet Demir',
        email: 'chef3@example.com',
        role: 'INSTRUCTOR',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
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

    // Kurslar oluştur
    const courses = await Promise.all([
      prisma.course.upsert({
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
      }),
      prisma.course.upsert({
        where: { id: 'course-2' },
        update: {},
        create: {
          id: 'course-2',
          title: 'Türk Mutfağı Klasikleri',
          description: 'Türk mutfağının en sevilen yemeklerini profesyonel şeflerden öğrenin. Dolma, kebap, pilav ve daha fazlası.',
          price: 399,
          level: 'INTERMEDIATE',
          duration: 720,
          isPublished: true,
          instructorId: instructor.id,
          categoryId: categories[1].id,
          imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800'
        }
      }),
      prisma.course.upsert({
        where: { id: 'course-3' },
        update: {},
        create: {
          id: 'course-3',
          title: 'Pastane Sanatı',
          description: 'Pasta, kurabiye ve tatlı yapımının inceliklerini keşfedin. Hamur işleri, krema ve dekorasyon teknikleri.',
          price: 499,
          level: 'ADVANCED',
          duration: 600,
          isPublished: true,
          instructorId: instructor.id,
          categoryId: categories[2].id,
          imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'
        }
      }),
      prisma.course.upsert({
        where: { id: 'course-4' },
        update: {},
        create: {
          id: 'course-4',
          title: 'Bıçak Teknikleri ve Doğrama Sanatı',
          description: 'Profesyonel bıçak kullanımı ve doğrama teknikleri. Güvenli ve hızlı doğrama yöntemleri.',
          price: 199,
          level: 'BEGINNER',
          duration: 240,
          isPublished: true,
          instructorId: instructor2.id,
          categoryId: categories[0].id,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'
        }
      }),
      prisma.course.upsert({
        where: { id: 'course-6' },
        update: {},
        create: {
          id: 'course-6',
          title: 'Pişirme Yöntemleri Masterclass',
          description: 'Haşlama, kavurma, fırınlama, ızgara ve buhar pişirme teknikleri.',
          price: 449,
          level: 'INTERMEDIATE',
          duration: 540,
          isPublished: true,
          instructorId: instructor.id,
          categoryId: categories[0].id,
          imageUrl: 'https://images.unsplash.com/photo-1556908114-f6e7ad7d3136?w=800'
        }
      }),
      prisma.course.upsert({
        where: { id: 'course-7' },
        update: {},
        create: {
          id: 'course-7',
          title: 'Osmanlı Saray Mutfağı',
          description: 'Osmanlı sarayının eşsiz lezzetleri. Tarihi reçeteler ve geleneksel pişirme teknikleri.',
          price: 599,
          level: 'ADVANCED',
          duration: 900,
          isPublished: true,
          instructorId: instructor2.id,
          categoryId: categories[1].id,
          imageUrl: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800'
        }
      }),
      prisma.course.upsert({
        where: { id: 'course-10' },
        update: {},
        create: {
          id: 'course-10',
          title: 'Çikolata Sanatı',
          description: 'Çikolata tempering, ganaj yapımı ve çikolata dekorasyonları. Profesyonel çikolata teknikleri.',
          price: 699,
          level: 'ADVANCED',
          duration: 780,
          isPublished: true,
          instructorId: instructor2.id,
          categoryId: categories[2].id,
          imageUrl: 'https://images.unsplash.com/photo-1549007953-2f2dc0b24019?w=800'
        }
      }),
      prisma.course.upsert({
        where: { id: 'course-12' },
        update: {},
        create: {
          id: 'course-12',
          title: 'Fransız Patisserie Teknikleri',
          description: 'Klasik Fransız tatlıları: Éclair, macaron, tarte ve daha fazlası. Profesyonel patisserie sırları.',
          price: 799,
          level: 'ADVANCED',
          duration: 960,
          isPublished: true,
          instructorId: instructor.id,
          categoryId: categories[2].id,
          imageUrl: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=800'
        }
      })
    ])

    // Dersler oluştur
    await Promise.all([
      prisma.lesson.upsert({
        where: { id: 'lesson-1' },
        update: {},
        create: {
          id: 'lesson-1',
          title: 'Mutfak Araçları ve Güvenlik',
          description: 'Mutfakta kullanacağınız temel araçlar ve güvenlik kuralları',
          duration: 45,
          order: 1,
          isFree: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2' },
        update: {},
        create: {
          id: 'lesson-2',
          title: 'Doğrama Teknikleri',
          description: 'Sebze ve meyveleri doğru şekilde doğrama yöntemleri',
          duration: 60,
          order: 2,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3' },
        update: {},
        create: {
          id: 'lesson-3',
          title: 'Türk Mutfağına Giriş',
          description: 'Türk mutfağının tarihi ve temel malzemeleri',
          duration: 40,
          order: 1,
          isFree: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-4' },
        update: {},
        create: {
          id: 'lesson-4',
          title: 'Pastane Temelleri',
          description: 'Pastanede kullanılan temel malzemeler ve araçlar',
          duration: 50,
          order: 1,
          isFree: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
        }
      })
    ])

    return NextResponse.json({ 
      success: true, 
      message: 'Comprehensive seed data created successfully!',
      data: {
        categories: categories.length,
        instructors: 3,
        admin: 1,
        courses: courses.length,
        lessons: 4
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
