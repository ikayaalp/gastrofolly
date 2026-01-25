import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  // Block in production - this is a development-only endpoint
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is disabled in production' }, { status: 403 })
  }

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
      where: { email: 'culinora@example.com' },
      update: {},
      create: {
        name: 'Şef Ayşe Kaya',
        email: 'culinora@example.com',
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

    // Dersler oluştur - Her kurs için detaylı dersler
    await Promise.all([
      // Course 1: Temel Mutfak Teknikleri (8 ders)
      prisma.lesson.upsert({
        where: { id: 'lesson-1-1' },
        update: {},
        create: {
          id: 'lesson-1-1',
          title: 'Mutfak Araçları ve Güvenlik',
          description: 'Mutfakta kullanacağınız temel araçlar, bıçak çeşitleri ve güvenlik kuralları. Profesyonel mutfak organizasyonu.',
          duration: 45,
          order: 1,
          isFree: true,
          isPublished: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-1-2' },
        update: {},
        create: {
          id: 'lesson-1-2',
          title: 'Bıçak Teknikleri ve Doğrama Yöntemleri',
          description: 'Julienne, brunoise, chiffonade ve diğer profesyonel doğrama teknikleri. Bıçak bileme ve bakımı.',
          duration: 60,
          order: 2,
          isPublished: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-1-3' },
        update: {},
        create: {
          id: 'lesson-1-3',
          title: 'Pişirme Yöntemleri: Kuru Isı',
          description: 'Fırınlama, ızgara ve kavurma teknikleri. Sıcaklık kontrolü ve Maillard reaksiyonu.',
          duration: 55,
          order: 3,
          isPublished: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-1-4' },
        update: {},
        create: {
          id: 'lesson-1-4',
          title: 'Pişirme Yöntemleri: Yaş Isı',
          description: 'Haşlama, buhar pişirme ve poaching teknikleri. Su sıcaklığı ve zamanlama.',
          duration: 50,
          order: 4,
          isPublished: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-1-5' },
        update: {},
        create: {
          id: 'lesson-1-5',
          title: 'Temel Soslar: Ana Soslar',
          description: 'Bechamel, velouté, espagnole, hollandaise ve domates sosu. Klasik Fransız mutfağının 5 ana sosu.',
          duration: 70,
          order: 5,
          isPublished: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-1-6' },
        update: {},
        create: {
          id: 'lesson-1-6',
          title: 'Stok ve Fon Hazırlama',
          description: 'Et suyu, tavuk suyu, sebze suyu ve balık fumet hazırlama teknikleri. Lezzet katmanları oluşturma.',
          duration: 65,
          order: 6,
          isPublished: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-1-7' },
        update: {},
        create: {
          id: 'lesson-1-7',
          title: 'Sebze Hazırlama ve Pişirme',
          description: 'Sebzelerin doğru şekilde temizlenmesi, kesilmesi ve pişirilmesi. Renk ve besin değeri koruma.',
          duration: 55,
          order: 7,
          isPublished: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-1-8' },
        update: {},
        create: {
          id: 'lesson-1-8',
          title: 'Plating ve Sunum Teknikleri',
          description: 'Profesyonel tabak sunumu, garnitür kullanımı ve görsel estetik. Renk dengesi ve kompozisyon.',
          duration: 60,
          order: 8,
          isPublished: true,
          courseId: courses[0].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),

      // Course 2: Türk Mutfağı Klasikleri (10 ders)
      prisma.lesson.upsert({
        where: { id: 'lesson-2-1' },
        update: {},
        create: {
          id: 'lesson-2-1',
          title: 'Türk Mutfağına Giriş',
          description: 'Türk mutfağının tarihi, bölgesel çeşitliliği ve temel malzemeleri. Osmanlı mutfak kültürü.',
          duration: 40,
          order: 1,
          isFree: true,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-2' },
        update: {},
        create: {
          id: 'lesson-2-2',
          title: 'Pilav Çeşitleri',
          description: 'Sade pilav, iç pilav, nohutlu pilav ve şehriyeli pilav yapımı. Pirinç seçimi ve pişirme teknikleri.',
          duration: 65,
          order: 2,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-3' },
        update: {},
        create: {
          id: 'lesson-2-3',
          title: 'Dolma Sanatı',
          description: 'Yaprak sarma, biber dolması, kabak dolması ve patlıcan dolması. İç harcı hazırlama ve sarma teknikleri.',
          duration: 80,
          order: 3,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-4' },
        update: {},
        create: {
          id: 'lesson-2-4',
          title: 'Kebap Çeşitleri',
          description: 'Adana kebap, urfa kebap, şiş kebap ve köfte yapımı. Marinasyon ve ızgara teknikleri.',
          duration: 75,
          order: 4,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-5' },
        update: {},
        create: {
          id: 'lesson-2-5',
          title: 'Zeytinyağlılar',
          description: 'Zeytinyağlı enginar, taze fasulye, barbunya ve pırasa. Soğuk servis teknikleri.',
          duration: 70,
          order: 5,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-6' },
        update: {},
        create: {
          id: 'lesson-2-6',
          title: 'Çorbalar',
          description: 'Mercimek çorbası, ezogelin, tarhana ve düğün çorbası. Geleneksel çorba yapım teknikleri.',
          duration: 60,
          order: 6,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-7' },
        update: {},
        create: {
          id: 'lesson-2-7',
          title: 'Börekler',
          description: 'Su böreği, sigara böreği, kol böreği ve gül böreği. Yufka açma ve katlamalar.',
          duration: 85,
          order: 7,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-8' },
        update: {},
        create: {
          id: 'lesson-2-8',
          title: 'Hamur İşleri',
          description: 'Pide, lahmacun, gözleme ve katmer yapımı. Hamur yoğurma ve açma teknikleri.',
          duration: 75,
          order: 8,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-9' },
        update: {},
        create: {
          id: 'lesson-2-9',
          title: 'Tatlılar',
          description: 'Baklava, künefe, kadayıf ve sütlaç yapımı. Şerbet hazırlama ve kıvam ayarı.',
          duration: 90,
          order: 9,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-2-10' },
        update: {},
        create: {
          id: 'lesson-2-10',
          title: 'Mezeler ve Salatalar',
          description: 'Haydari, acılı ezme, patlıcan salatası ve çoban salata. Sunum ve servis teknikleri.',
          duration: 55,
          order: 10,
          isPublished: true,
          courseId: courses[1].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),

      // Course 3: Pastane Sanatı (9 ders)
      prisma.lesson.upsert({
        where: { id: 'lesson-3-1' },
        update: {},
        create: {
          id: 'lesson-3-1',
          title: 'Pastane Temelleri',
          description: 'Pastanede kullanılan temel malzemeler, araçlar ve ölçü birimleri. Fırın sıcaklık kontrolü.',
          duration: 50,
          order: 1,
          isFree: true,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3-2' },
        update: {},
        create: {
          id: 'lesson-3-2',
          title: 'Hamur Çeşitleri',
          description: 'Kek hamuru, kurabiye hamuru, tart hamuru ve choux hamuru. Hamur yapım teknikleri ve püf noktaları.',
          duration: 75,
          order: 2,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3-3' },
        update: {},
        create: {
          id: 'lesson-3-3',
          title: 'Krem ve Dolgu Çeşitleri',
          description: 'Pastacı kreması, diplomat krema, şantiy ve ganaj yapımı. Kıvam ayarı ve saklama koşulları.',
          duration: 70,
          order: 3,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3-4' },
        update: {},
        create: {
          id: 'lesson-3-4',
          title: 'Pasta Yapımı',
          description: 'Yaş pasta, doğum günü pastası ve özel gün pastaları. Katlama ve kremalama teknikleri.',
          duration: 85,
          order: 4,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3-5' },
        update: {},
        create: {
          id: 'lesson-3-5',
          title: 'Kurabiye Sanatı',
          description: 'Klasik kurabiyeler, dekoratif kurabiyeler ve özel gün kurabiyeleri. Şekillendirme ve pişirme.',
          duration: 65,
          order: 5,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3-6' },
        update: {},
        create: {
          id: 'lesson-3-6',
          title: 'Dekorasyon Teknikleri',
          description: 'Fondant kaplama, royal icing, buttercream dekorasyon. Çiçek yapımı ve süsleme teknikleri.',
          duration: 80,
          order: 6,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3-7' },
        update: {},
        create: {
          id: 'lesson-3-7',
          title: 'Tart ve Tartölet',
          description: 'Meyve tartları, çikolatalı tart ve mini tartöletler. Hamur pişirme ve dolgu teknikleri.',
          duration: 70,
          order: 7,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3-8' },
        update: {},
        create: {
          id: 'lesson-3-8',
          title: 'Mousse ve Bavarois',
          description: 'Çikolata mousse, meyve mousse ve bavarois yapımı. Jelatin kullanımı ve kıvam kontrolü.',
          duration: 65,
          order: 8,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-3-9' },
        update: {},
        create: {
          id: 'lesson-3-9',
          title: 'Özel Gün Pastaları',
          description: 'Düğün pastası, nişan pastası ve özel tasarım pastalar. Proje yönetimi ve sunum.',
          duration: 95,
          order: 9,
          isPublished: true,
          courseId: courses[2].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),

      // Course 4: Bıçak Teknikleri ve Doğrama Sanatı (6 ders)
      prisma.lesson.upsert({
        where: { id: 'lesson-4-1' },
        update: {},
        create: {
          id: 'lesson-4-1',
          title: 'Bıçak Çeşitleri ve Seçimi',
          description: 'Şef bıçağı, santoku, fileto bıçağı ve diğer mutfak bıçakları. Doğru bıçak seçimi.',
          duration: 35,
          order: 1,
          isFree: true,
          isPublished: true,
          courseId: courses[3].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-4-2' },
        update: {},
        create: {
          id: 'lesson-4-2',
          title: 'Bıçak Tutuş ve Güvenlik',
          description: 'Doğru bıçak tutuş teknikleri, parmak pozisyonları ve güvenli çalışma yöntemleri.',
          duration: 40,
          order: 2,
          isPublished: true,
          courseId: courses[3].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-4-3' },
        update: {},
        create: {
          id: 'lesson-4-3',
          title: 'Temel Doğrama Teknikleri',
          description: 'Julienne, brunoise, mirepoix, chiffonade ve diğer klasik doğrama teknikleri.',
          duration: 55,
          order: 3,
          isPublished: true,
          courseId: courses[3].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-4-4' },
        update: {},
        create: {
          id: 'lesson-4-4',
          title: 'Sebze Doğrama Uygulamaları',
          description: 'Soğan, havuç, kereviz ve diğer sebzelerin profesyonel doğranması. Hız ve hassasiyet.',
          duration: 50,
          order: 4,
          isPublished: true,
          courseId: courses[3].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-4-5' },
        update: {},
        create: {
          id: 'lesson-4-5',
          title: 'Et ve Balık Hazırlama',
          description: 'Et parçalama, fileto çıkarma ve balık temizleme teknikleri. Kemik ve kılçık ayıklama.',
          duration: 60,
          order: 5,
          isPublished: true,
          courseId: courses[3].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-4-6' },
        update: {},
        create: {
          id: 'lesson-4-6',
          title: 'Bıçak Bakımı ve Bileme',
          description: 'Bıçak bileme teknikleri, bileme taşı kullanımı ve bıçak bakımı. Uzun ömürlü kullanım.',
          duration: 45,
          order: 6,
          isPublished: true,
          courseId: courses[3].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),

      // Course 6: Pişirme Yöntemleri Masterclass (8 ders)
      prisma.lesson.upsert({
        where: { id: 'lesson-6-1' },
        update: {},
        create: {
          id: 'lesson-6-1',
          title: 'Pişirme Bilimi',
          description: 'Isı transferi, protein denatürasyonu ve Maillard reaksiyonu. Pişirmenin bilimsel temelleri.',
          duration: 50,
          order: 1,
          isFree: true,
          isPublished: true,
          courseId: courses[4].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-6-2' },
        update: {},
        create: {
          id: 'lesson-6-2',
          title: 'Sautéing ve Pan-Frying',
          description: 'Tavada kavurma teknikleri, yağ sıcaklığı kontrolü ve karamelizasyon.',
          duration: 65,
          order: 2,
          isPublished: true,
          courseId: courses[4].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-6-3' },
        update: {},
        create: {
          id: 'lesson-6-3',
          title: 'Roasting ve Baking',
          description: 'Fırında pişirme teknikleri, sıcaklık ayarları ve zamanlama. Et ve sebze kavurma.',
          duration: 70,
          order: 3,
          isPublished: true,
          courseId: courses[4].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-6-4' },
        update: {},
        create: {
          id: 'lesson-6-4',
          title: 'Grilling ve Broiling',
          description: 'Izgara teknikleri, ızgara işaretleri ve marinasyon. Doğrudan ve dolaylı ısı kullanımı.',
          duration: 65,
          order: 4,
          isPublished: true,
          courseId: courses[4].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-6-5' },
        update: {},
        create: {
          id: 'lesson-6-5',
          title: 'Braising ve Stewing',
          description: 'Uzun pişirme teknikleri, et yumuşatma ve lezzet geliştirme. Düşük ısıda pişirme.',
          duration: 75,
          order: 5,
          isPublished: true,
          courseId: courses[4].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-6-6' },
        update: {},
        create: {
          id: 'lesson-6-6',
          title: 'Steaming ve Poaching',
          description: 'Buhar pişirme ve suda pişirme teknikleri. Hassas sıcaklık kontrolü ve zamanlama.',
          duration: 60,
          order: 6,
          isPublished: true,
          courseId: courses[4].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-6-7' },
        update: {},
        create: {
          id: 'lesson-6-7',
          title: 'Deep-Frying Teknikleri',
          description: 'Derin yağda kızartma, yağ sıcaklığı ve kaplama teknikleri. Tempura ve diğer kızartmalar.',
          duration: 65,
          order: 7,
          isPublished: true,
          courseId: courses[4].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-6-8' },
        update: {},
        create: {
          id: 'lesson-6-8',
          title: 'Sous-Vide ve Modern Teknikler',
          description: 'Vakumda pişirme, hassas sıcaklık kontrolü ve moleküler gastronomi teknikleri.',
          duration: 80,
          order: 8,
          isPublished: true,
          courseId: courses[4].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),

      // Course 7: Osmanlı Saray Mutfağı (12 ders)
      prisma.lesson.upsert({
        where: { id: 'lesson-7-1' },
        update: {},
        create: {
          id: 'lesson-7-1',
          title: 'Osmanlı Mutfak Kültürü',
          description: 'Osmanlı saray mutfağının tarihi, gelenekleri ve protokolleri. Matbah-ı Amire.',
          duration: 55,
          order: 1,
          isFree: true,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-2' },
        update: {},
        create: {
          id: 'lesson-7-2',
          title: 'Saray Pilavları',
          description: 'Hünkar beğendi, sultan pilavı ve saray pilavı. Osmanlı pilav geleneği ve teknikleri.',
          duration: 75,
          order: 2,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-3' },
        update: {},
        create: {
          id: 'lesson-7-3',
          title: 'Saray Kebapları',
          description: 'Hünkar kebabı, sultan kebabı ve saray kebapları. Özel marinasyon ve pişirme teknikleri.',
          duration: 80,
          order: 3,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-4' },
        update: {},
        create: {
          id: 'lesson-7-4',
          title: 'Dolma ve Sarma Çeşitleri',
          description: 'Saray dolmaları, özel sarma teknikleri ve geleneksel tarifler. İç harcı sırları.',
          duration: 85,
          order: 4,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-5' },
        update: {},
        create: {
          id: 'lesson-7-5',
          title: 'Saray Çorbaları',
          description: 'Düğün çorbası, paça çorbası ve saray çorbaları. Geleneksel çorba yapım teknikleri.',
          duration: 70,
          order: 5,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-6' },
        update: {},
        create: {
          id: 'lesson-7-6',
          title: 'Saray Tatlıları',
          description: 'Zerde, aşure, güllaç ve saray helvası. Özel gün tatlıları ve sunumları.',
          duration: 90,
          order: 6,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-7' },
        update: {},
        create: {
          id: 'lesson-7-7',
          title: 'Hamur İşleri ve Börekler',
          description: 'Saray böreği, çibörek ve özel hamur işleri. Kat kat yufka açma teknikleri.',
          duration: 80,
          order: 7,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-8' },
        update: {},
        create: {
          id: 'lesson-7-8',
          title: 'Sebze Yemekleri',
          description: 'İmam bayıldı, karnıyarık ve saray sebze yemekleri. Zeytinyağlı ve sıcak servis.',
          duration: 75,
          order: 8,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-9' },
        update: {},
        create: {
          id: 'lesson-7-9',
          title: 'Reçel ve Şerbetler',
          description: 'Gül reçeli, kayısı reçeli ve geleneksel şerbetler. Kıvam ayarı ve saklama.',
          duration: 65,
          order: 9,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-10' },
        update: {},
        create: {
          id: 'lesson-7-10',
          title: 'Turşu ve Mezeler',
          description: 'Saray turşuları, mezeler ve meze sunumları. Fermantasyon teknikleri.',
          duration: 70,
          order: 10,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-11' },
        update: {},
        create: {
          id: 'lesson-7-11',
          title: 'İçecekler ve Kahve',
          description: 'Türk kahvesi, şerbet ve geleneksel içecekler. Kahve pişirme sanatı.',
          duration: 60,
          order: 11,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-7-12' },
        update: {},
        create: {
          id: 'lesson-7-12',
          title: 'Sofra Adabı ve Sunum',
          description: 'Osmanlı sofra düzeni, servis protokolü ve sunum sanatı. Geleneksel sofra kültürü.',
          duration: 55,
          order: 12,
          isPublished: true,
          courseId: courses[5].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),

      // Course 10: Çikolata Sanatı (10 ders)
      prisma.lesson.upsert({
        where: { id: 'lesson-10-1' },
        update: {},
        create: {
          id: 'lesson-10-1',
          title: 'Çikolata Bilimi',
          description: 'Kakao çekirdeğinden çikolataya. Çikolata çeşitleri ve kalite kriterleri.',
          duration: 50,
          order: 1,
          isFree: true,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-2' },
        update: {},
        create: {
          id: 'lesson-10-2',
          title: 'Tempering Teknikleri',
          description: 'Çikolata temperleme yöntemleri, sıcaklık kontrolü ve kristalizasyon. Parlak yüzey elde etme.',
          duration: 75,
          order: 2,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-3' },
        update: {},
        create: {
          id: 'lesson-10-3',
          title: 'Ganaj Yapımı',
          description: 'Klasik ganaj, montée ganaj ve whipped ganaj. Kıvam ayarı ve kullanım alanları.',
          duration: 70,
          order: 3,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-4' },
        update: {},
        create: {
          id: 'lesson-10-4',
          title: 'Bonbon ve Truffle',
          description: 'El yapımı çikolatalar, truffle yapımı ve dolgu çeşitleri. Şekillendirme teknikleri.',
          duration: 85,
          order: 4,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-5' },
        update: {},
        create: {
          id: 'lesson-10-5',
          title: 'Çikolata Dekorasyonları',
          description: 'Çikolata süslemeler, transfer sheet kullanımı ve çikolata çiçekler. Artistik teknikler.',
          duration: 80,
          order: 5,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-6' },
        update: {},
        create: {
          id: 'lesson-10-6',
          title: 'Çikolata Heykeller',
          description: 'Üç boyutlu çikolata çalışmaları, kalıp kullanımı ve montaj teknikleri.',
          duration: 90,
          order: 6,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-7' },
        update: {},
        create: {
          id: 'lesson-10-7',
          title: 'Praline ve Gianduja',
          description: 'Fındık ezmesi, praline yapımı ve gianduja teknikleri. Kaplama ve dolgu.',
          duration: 75,
          order: 7,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-8' },
        update: {},
        create: {
          id: 'lesson-10-8',
          title: 'Çikolata Tatlıları',
          description: 'Brownie, çikolatalı kek, mousse ve diğer çikolatalı tatlılar. Kombinasyonlar.',
          duration: 80,
          order: 8,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-9' },
        update: {},
        create: {
          id: 'lesson-10-9',
          title: 'Çikolata Boyama',
          description: 'Kakao yağı boyama, airbrush teknikleri ve renk karışımları. Sanatsal uygulamalar.',
          duration: 70,
          order: 9,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-10-10' },
        update: {},
        create: {
          id: 'lesson-10-10',
          title: 'Profesyonel Paketleme',
          description: 'Çikolata paketleme, saklama koşulları ve sunum. Ticari uygulamalar.',
          duration: 60,
          order: 10,
          isPublished: true,
          courseId: courses[6].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),

      // Course 12: Fransız Patisserie Teknikleri (12 ders)
      prisma.lesson.upsert({
        where: { id: 'lesson-12-1' },
        update: {},
        create: {
          id: 'lesson-12-1',
          title: 'Fransız Patisserie Tarihi',
          description: 'Fransız pastacılığının tarihi, gelenekleri ve temel prensipleri. Klasik teknikler.',
          duration: 55,
          order: 1,
          isFree: true,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-2' },
        update: {},
        create: {
          id: 'lesson-12-2',
          title: 'Pâte à Choux',
          description: 'Choux hamuru yapımı, pişirme teknikleri. Éclair, profiterol ve croquembouche.',
          duration: 80,
          order: 2,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-3' },
        update: {},
        create: {
          id: 'lesson-12-3',
          title: 'Macaron Sanatı',
          description: 'Fransız macaronu yapımı, meringue teknikleri ve dolgu çeşitleri. Renklendirme.',
          duration: 90,
          order: 3,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-4' },
        update: {},
        create: {
          id: 'lesson-12-4',
          title: 'Tarte Teknikleri',
          description: 'Pâte sucrée, pâte sablée ve tart yapımı. Tarte tatin, tarte au citron ve diğerleri.',
          duration: 85,
          order: 4,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-5' },
        update: {},
        create: {
          id: 'lesson-12-5',
          title: 'Pâte Feuilletée',
          description: 'Milföy hamuru yapımı, katlamalar ve pişirme. Croissant, pain au chocolat.',
          duration: 95,
          order: 5,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-6' },
        update: {},
        create: {
          id: 'lesson-12-6',
          title: 'Crème Pâtissière ve Varyasyonları',
          description: 'Pastacı kreması, diplomat krema, mousseline ve diğer kremalar. Kullanım alanları.',
          duration: 75,
          order: 6,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-7' },
        update: {},
        create: {
          id: 'lesson-12-7',
          title: 'Entremets Modernes',
          description: 'Modern Fransız tatlıları, katmanlı tatlılar ve mousse çalışmaları. Glazür teknikleri.',
          duration: 100,
          order: 7,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-8' },
        update: {},
        create: {
          id: 'lesson-12-8',
          title: 'Viennoiserie',
          description: 'Croissant, pain au chocolat, brioche ve diğer Viennoiserie ürünleri. Hamur teknikleri.',
          duration: 90,
          order: 8,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-9' },
        update: {},
        create: {
          id: 'lesson-12-9',
          title: 'Meringue Çeşitleri',
          description: 'Fransız, İsviçre ve İtalyan meringue. Pavlova, beze ve diğer uygulamalar.',
          duration: 70,
          order: 9,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-10' },
        update: {},
        create: {
          id: 'lesson-12-10',
          title: 'Şeker Çalışmaları',
          description: 'Karamel, nougatine, isomalt ve şeker dekorasyonları. Şeker pişirme teknikleri.',
          duration: 85,
          order: 10,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-11' },
        update: {},
        create: {
          id: 'lesson-12-11',
          title: 'Klasik Fransız Tatlıları',
          description: 'Crème brûlée, île flottante, mille-feuille ve diğer klasikler. Geleneksel tarifler.',
          duration: 80,
          order: 11,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
        }
      }),
      prisma.lesson.upsert({
        where: { id: 'lesson-12-12' },
        update: {},
        create: {
          id: 'lesson-12-12',
          title: 'Plated Desserts',
          description: 'Tabakta tatlı sunumu, sos teknikleri ve modern sunum. Michelin yıldızlı sunum.',
          duration: 75,
          order: 12,
          isPublished: true,
          courseId: courses[7].id,
          videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
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
