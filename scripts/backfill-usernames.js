const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generateUniqueUsername(name, email) {
    let baseSlug = ''
    if (name) {
        baseSlug = name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/ /g, '_')
            .replace(/[^a-z0-9_]/g, '')
    }
    
    if (!baseSlug) {
        baseSlug = email.split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
    }

    if (!baseSlug) {
        baseSlug = 'user'
    }

    let username = baseSlug
    let counter = 1
    
    while (true) {
        const existingUser = await prisma.user.findUnique({
            where: { username }
        })
        
        if (!existingUser) {
            break
        }
        
        counter++
        username = `${baseSlug}${counter}`
    }
    
    return username
}

async function backfill() {
  console.log('Kullanıcı adları backfill işlemi başlatılıyor...')
  
  try {
      const users = await prisma.user.findMany({
        where: { username: null }
      })
      
      console.log(`${users.length} kullanıcı için username atanacak.`)
      
      let successCount = 0
      let errorCount = 0
      
      for (const user of users) {
        try {
          const username = await generateUniqueUsername(user.name, user.email)
          
          await prisma.user.update({
            where: { id: user.id },
            data: { username }
          })
          
          console.log(`✅ [${user.email}] -> @${username}`)
          successCount++
        } catch (error) {
          console.error(`❌ [${user.email}] Hata:`, error)
          errorCount++
        }
      }
      
      console.log(`\nİşlem tamamlandı: ${successCount} başarılı, ${errorCount} hatalı.`)
  } catch(error) {
      console.error('Genel Hata:', error)
  } finally {
      await prisma.$disconnect()
  }
}

backfill()
