const { PrismaClient } = require('@prisma/client')

// SQLite'dan veri çek
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db"
    }
  }
})

// PostgreSQL'e veri gönder (production URL'inizi buraya yazın)
const postgresClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRODUCTION_DATABASE_URL
    }
  }
})

async function migrateData() {
  try {
    console.log('🔄 Veri migration başlıyor...')
    
    // Tüm tabloları migrate et
    const categories = await sqliteClient.category.findMany()
    const users = await sqliteClient.user.findMany()
    const courses = await sqliteClient.course.findMany()
    const lessons = await sqliteClient.lesson.findMany()
    const reviews = await sqliteClient.review.findMany()
    
    console.log(`📊 ${categories.length} kategori, ${users.length} kullanıcı, ${courses.length} kurs, ${lessons.length} ders bulundu`)
    
    // PostgreSQL'e aktar
    for (const category of categories) {
      await postgresClient.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      })
    }
    
    for (const user of users) {
      await postgresClient.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    
    for (const course of courses) {
      await postgresClient.course.upsert({
        where: { id: course.id },
        update: course,
        create: course
      })
    }
    
    for (const lesson of lessons) {
      await postgresClient.lesson.upsert({
        where: { id: lesson.id },
        update: lesson,
        create: lesson
      })
    }
    
    for (const review of reviews) {
      await postgresClient.review.upsert({
        where: { id: review.id },
        update: review,
        create: review
      })
    }
    
    console.log('✅ Migration tamamlandı!')
    
  } catch (error) {
    console.error('❌ Migration hatası:', error)
  } finally {
    await sqliteClient.$disconnect()
    await postgresClient.$disconnect()
  }
}

migrateData()
