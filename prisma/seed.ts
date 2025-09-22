import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
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

  // Daha fazla eğitmen oluştur
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

  // Admin kullanıcıları oluştur
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chef2.com' },
    update: {},
    create: {
      name: 'Admin Kullanıcı',
      email: 'admin@chef2.com',
      role: 'ADMIN',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
    }
  })

  const admin2 = await prisma.user.upsert({
    where: { email: 'superadmin@chef2.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@chef2.com',
      role: 'ADMIN',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'
    }
  })

  // Kurslar oluştur
  const courses = await Promise.all([
    // Temel Mutfak Kategorisi
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

    // Türk Mutfağı Kategorisi
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
      where: { id: 'course-8' },
      update: {},
      create: {
        id: 'course-8',
        title: 'Anadolu Yöresel Lezzetleri',
        description: 'Türkiye\'nin farklı yörelerinden özel tarifler. Yerel malzemeler ve geleneksel yöntemler.',
        price: 459,
        level: 'INTERMEDIATE',
        duration: 660,
        isPublished: true,
        instructorId: instructor3.id,
        categoryId: categories[1].id,
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'
      }
    }),
    prisma.course.upsert({
      where: { id: 'course-9' },
      update: {},
      create: {
        id: 'course-9',
        title: 'Türk Kahvaltı Kültürü',
        description: 'Geleneksel Türk kahvaltısının incelikleri. Peynir, reçel, börek ve daha fazlası.',
        price: 299,
        level: 'BEGINNER',
        duration: 420,
        isPublished: true,
        instructorId: instructor.id,
        categoryId: categories[1].id,
        imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800'
      }
    }),

    // Pastane Sanatı Kategorisi
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
      where: { id: 'course-11' },
      update: {},
      create: {
        id: 'course-11',
        title: 'Artisan Ekmek Yapımı',
        description: 'El yapımı ekmekler, maya kültürü ve fermentasyon teknikleri. Geleneksel ve modern ekmek tarifleri.',
        price: 379,
        level: 'INTERMEDIATE',
        duration: 480,
        isPublished: true,
        instructorId: instructor3.id,
        categoryId: categories[2].id,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'
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
    }),
    prisma.course.upsert({
      where: { id: 'course-13' },
      update: {},
      create: {
        id: 'course-13',
        title: 'Pasta Dekorasyon Sanatı',
        description: 'Fondant, buttercream ve royal icing ile pasta dekorasyonu. Çiçek yapımı ve detay çalışmaları.',
        price: 549,
        level: 'INTERMEDIATE',
        duration: 600,
        isPublished: true,
        instructorId: instructor2.id,
        categoryId: categories[2].id,
        imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800'
      }
    }),
    prisma.course.upsert({
      where: { id: 'course-14' },
      update: {
        imageUrl: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80'
      },
      create: {
        id: 'course-14',
        title: 'Geleneksel Türk Tatlıları',
        description: 'Baklava, kadayıf, muhallebi ve daha fazlası. Geleneksel Türk tatlı yapım teknikleri.',
        price: 429,
        level: 'INTERMEDIATE',
        duration: 540,
        isPublished: true,
        instructorId: instructor3.id,
        categoryId: categories[2].id,
        imageUrl: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80'
      }
    })
  ])

  // Dersler oluştur
  const lessons = await Promise.all([
    // Temel Mutfak Teknikleri dersleri
    prisma.lesson.create({
      data: {
        title: 'Mutfak Araçları ve Güvenlik',
        description: 'Mutfakta kullanacağınız temel araçlar ve güvenlik kuralları',
        duration: 45,
        order: 1,
        isFree: true,
        courseId: courses[0].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Doğrama Teknikleri',
        description: 'Sebze ve meyveleri doğru şekilde doğrama yöntemleri',
        duration: 60,
        order: 2,
        courseId: courses[0].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Temel Pişirme Yöntemleri',
        description: 'Haşlama, kavurma, fırınlama ve diğer pişirme teknikleri',
        duration: 75,
        order: 3,
        courseId: courses[0].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),

    // Türk Mutfağı dersleri
    prisma.lesson.create({
      data: {
        title: 'Türk Mutfağına Giriş',
        description: 'Türk mutfağının tarihi ve temel malzemeleri',
        duration: 40,
        order: 1,
        isFree: true,
        courseId: courses[1].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Dolma Çeşitleri',
        description: 'Yaprak dolması, biber dolması ve diğer dolma çeşitleri',
        duration: 90,
        order: 2,
        courseId: courses[1].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Kebap Teknikleri',
        description: 'Adana, urfa ve diğer kebap çeşitlerinin yapımı',
        duration: 85,
        order: 3,
        courseId: courses[1].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),

    // Pastane dersleri
    prisma.lesson.create({
      data: {
        title: 'Pastane Temelleri',
        description: 'Pastanede kullanılan temel malzemeler ve araçlar',
        duration: 50,
        order: 1,
        isFree: true,
        courseId: courses[2].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Pandispanya Yapımı',
        description: 'Mükemmel pandispanya için püf noktaları',
        duration: 70,
        order: 2,
        courseId: courses[2].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Krema ve Dekorasyon',
        description: 'Çikolata ganaj, buttercream ve dekorasyon teknikleri',
        duration: 95,
        order: 3,
        courseId: courses[2].id,
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),

    // Pasta Dekorasyon Sanatı dersleri (course-13)
    prisma.lesson.create({
      data: {
        title: 'Fondant Temelleri',
        description: 'Fondant yapımı ve temel şekillendirme teknikleri',
        duration: 50,
        order: 1,
        isFree: true,
        courseId: 'course-13',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Buttercream Teknikleri',
        description: 'Buttercream yapımı ve dekorasyon yöntemleri',
        duration: 65,
        order: 2,
        courseId: 'course-13',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Çiçek Yapımı ve Detaylar',
        description: 'Royal icing ile çiçek yapımı ve pasta dekorasyonu detayları',
        duration: 80,
        order: 3,
        courseId: 'course-13',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'İleri Seviye Dekorasyon',
        description: 'Karmaşık pasta dekorasyonları ve profesyonel teknikler',
        duration: 90,
        order: 4,
        courseId: 'course-13',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    })
  ])

  // Örnek değerlendirmeler oluştur
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {
      name: 'İsmail Kayaalp',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
    },
    create: {
      name: 'İsmail Kayaalp',
      email: 'student@example.com',
      role: 'STUDENT',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
    }
  })

  // Daha fazla öğrenci oluştur
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      name: 'Mehmet Kaya',
      email: 'student2@example.com',
      role: 'STUDENT',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
    }
  })

  const student3 = await prisma.user.upsert({
    where: { email: 'student3@example.com' },
    update: {},
    create: {
      name: 'Fatma Yılmaz',
      email: 'student3@example.com',
      role: 'STUDENT',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
    }
  })

  // Örnek değerlendirmeler oluştur
  await Promise.all([
    prisma.review.create({
      data: {
        rating: 5,
        comment: 'Harika bir kurs! Temel teknikleri çok iyi öğrendim.',
        userId: student.id,
        courseId: courses[0].id
      }
    }),
    prisma.review.create({
      data: {
        rating: 4,
        comment: 'Türk mutfağının inceliklerini öğrenmek için mükemmel.',
        userId: student.id,
        courseId: courses[1].id
      }
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: 'Pastane sanatını bu kadar detaylı anlatan başka kurs görmedim!',
        userId: student2.id,
        courseId: courses[2].id
      }
    }),
    prisma.review.create({
      data: {
        rating: 4,
        comment: 'Bıçak teknikleri gerçekten çok faydalıydı.',
        userId: student3.id,
        courseId: courses[3].id
      }
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: 'Osmanlı mutfağının sırları muhteşem!',
        userId: student.id,
        courseId: courses[6].id
      }
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: 'Çikolata sanatını öğrenmek için harika bir kurs.',
        userId: student2.id,
        courseId: courses[9].id
      }
    })
  ])

  // Forum kategorileri oluştur
  const forumCategories = await Promise.all([
    // Varsayılan kategori
    prisma.forumCategory.upsert({
      where: { slug: 'genel' },
      update: {},
      create: {
        id: 'default-category',
        name: 'Genel',
        description: 'Genel tartışmalar',
        slug: 'genel',
        color: '#6b7280'
      }
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'tarifler' },
      update: {},
      create: {
        name: 'Tarifler',
        description: 'Yemek tarifleri ve pişirme teknikleri',
        slug: 'tarifler',
        color: '#f97316'
      }
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'ekipman' },
      update: {},
      create: {
        name: 'Ekipman',
        description: 'Mutfak ekipmanları ve araçlar',
        slug: 'ekipman',
        color: '#22c55e'
      }
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'beslenme' },
      update: {},
      create: {
        name: 'Beslenme',
        description: 'Sağlıklı beslenme ve diyet',
        slug: 'beslenme',
        color: '#3b82f6'
      }
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'kariyer' },
      update: {},
      create: {
        name: 'Kariyer',
        description: 'Mutfak kariyeri ve iş fırsatları',
        slug: 'kariyer',
        color: '#a855f7'
      }
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'kultur' },
      update: {},
      create: {
        name: 'Kültür',
        description: 'Yemek kültürü ve gelenekler',
        slug: 'kultur',
        color: '#ef4444'
      }
    })
  ])

  // Örnek forum başlıkları oluştur
  await Promise.all([
    prisma.topic.upsert({
      where: { slug: 'en-iyi-makarna-sosu-tarifi' },
      update: {},
      create: {
        title: 'En İyi Makarna Sosu Tarifi Nedir?',
        content: 'Carbonara mı yoksa Arrabbiata mı? Sizin favoriniz hangisi? Merak ediyorum hangi sos türü daha çok tercih ediliyor.',
        slug: 'en-iyi-makarna-sosu-tarifi',
        authorId: instructor.id,
        categoryId: forumCategories[0].id,
        likeCount: 15,
        viewCount: 124
      }
    }),
    prisma.topic.upsert({
      where: { slug: 'mutfak-ekipmanlari-onerileri' },
      update: {},
      create: {
        title: 'Mutfak Ekipmanları Önerileri',
        content: 'Yeni mutfağım için ekipman alacağım. Önerilerinizi bekliyorum! Hangi markaları tercih ediyorsunuz?',
        slug: 'mutfak-ekipmanlari-onerileri',
        authorId: instructor2.id,
        categoryId: forumCategories[1].id,
        likeCount: 12,
        viewCount: 89
      }
    }),
    prisma.topic.upsert({
      where: { slug: 'vegan-yemeklerde-protein-kaynaklari' },
      update: {},
      create: {
        title: 'Vegan Yemeklerde Protein Kaynakları',
        content: 'Vegan mutfağında protein dengesi nasıl sağlanır? Hangi besinleri önerirsiniz?',
        slug: 'vegan-yemeklerde-protein-kaynaklari',
        authorId: student.id,
        categoryId: forumCategories[2].id,
        likeCount: 28,
        viewCount: 156
      }
    }),
    prisma.topic.upsert({
      where: { slug: 'pastane-acmak-istiyorum-tavsiyeleriniz' },
      update: {},
      create: {
        title: 'Pastane Açmak İstiyorum - Tavsiyeleriniz?',
        content: 'Kendi pastanemi açmayı planlıyorum. Deneyimli arkadaşların tavsiyeleri... Neleri dikkate almalıyım?',
        slug: 'pastane-acmak-istiyorum-tavsiyeleriniz',
        authorId: student2.id,
        categoryId: forumCategories[3].id,
        likeCount: 35,
        viewCount: 203
      }
    }),
    prisma.topic.upsert({
      where: { slug: 'turk-mutfaginin-dunyaya-tanitimi' },
      update: {},
      create: {
        title: 'Türk Mutfağının Dünyaya Tanıtımı',
        content: 'Türk mutfağını yabancılara nasıl daha iyi tanıtabiliriz? Hangi yemeklerimiz daha çok ilgi çeker?',
        slug: 'turk-mutfaginin-dunyaya-tanitimi',
        authorId: instructor3.id,
        categoryId: forumCategories[4].id,
        likeCount: 22,
        viewCount: 167
      }
    })
  ])



  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
