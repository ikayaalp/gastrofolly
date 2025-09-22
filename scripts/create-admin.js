const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Admin kullanıcı oluştur
    const admin = await prisma.user.create({
      data: {
        email: 'admin@chef.com',
        name: 'Admin User',
        role: 'ADMIN'
      }
    })

    console.log('✅ Admin kullanıcı oluşturuldu:', admin.email)
    console.log('ID:', admin.id)
    console.log('Role:', admin.role)

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ Admin kullanıcı zaten mevcut')
      
      // Mevcut kullanıcıyı admin yap
      const user = await prisma.user.update({
        where: { email: 'admin@chef.com' },
        data: { role: 'ADMIN' }
      })
      
      console.log('✅ Kullanıcı admin yapıldı:', user.email)
    } else {
      console.error('❌ Hata:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
