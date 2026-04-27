const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Admin kullanıcısı oluştur
    const admin = await prisma.user.upsert({
      where: { email: 'admin@gastrofolly.com' },
      update: {
        role: 'ADMIN'
      },
      create: {
        name: 'Admin User',
        email: 'admin@gastrofolly.com',
        role: 'ADMIN',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
      }
    })

    console.log('🎉 Admin kullanıcısı oluşturuldu!')
    console.log('📧 Email: admin@gastrofolly.com')
    console.log('👤 İsim:', admin.name)
    console.log('🔑 Role:', admin.role)
    console.log('')
    console.log('🚀 Giriş yapmak için:')
    console.log('1. Uygulamayı başlatın: npm run dev')
    console.log('2. /auth/signin adresine gidin')
    console.log('3. Email: admin@gastrofolly.com ile giriş yapın')
    console.log('4. /admin/videos adresine gidin')

  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
