const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('Culinora1221.', 10)

    const user = await prisma.user.upsert({
      where: { email: 'test@culinora.net' },
      update: {
        password: hashedPassword,
        name: 'Test User',
      },
      create: {
        name: 'Test User',
        email: 'test@culinora.net',
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'STUDENT',
        image: 'https://ui-avatars.com/api/?name=Test+User&background=FF6B00&color=fff',
      }
    })

    console.log('✅ Test kullanıcısı oluşturuldu!')
    console.log('📧 Email   : test@culinora.net')
    console.log('🔑 Şifre   : Culinora1221.')
    console.log('👤 İsim    :', user.name)
    console.log('🆔 ID      :', user.id)

  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
