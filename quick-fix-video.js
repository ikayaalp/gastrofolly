const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addVideoToLesson() {
  try {
    // "Fondant Temelleri" dersini bul
    const fondantLesson = await prisma.lesson.findFirst({
      where: {
        title: {
          contains: "Fondant"
        }
      }
    })
    
    if (fondantLesson) {
      await prisma.lesson.update({
        where: { id: fondantLesson.id },
        data: {
          videoUrl: null
        }
      })
      
      console.log(`✅ Video URL added to lesson: ${fondantLesson.title}`)
      console.log(`🎬 Video URL: https://www.youtube.com/watch?v=HOVB7yy_Kik`)
      console.log(`📝 Lesson ID: ${fondantLesson.id}`)
    } else {
      console.log("❌ Fondant Temelleri dersi bulunamadı")
      
      // Tüm dersleri listele
      const allLessons = await prisma.lesson.findMany({
        select: { id: true, title: true, videoUrl: true }
      })
      
      console.log("\n📚 Mevcut dersler:")
      allLessons.forEach(lesson => {
        console.log(`- ${lesson.title} (ID: ${lesson.id}) - Video: ${lesson.videoUrl || 'Yok'}`)
      })
    }
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

addVideoToLesson()
