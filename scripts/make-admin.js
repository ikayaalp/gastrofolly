const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function makeAdmin() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('Kullanım: node make-admin.js email@example.com')
    process.exit(1)
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    })
    
    console.log(`✅ ${user.name} (${user.email}) artık admin!`)
  } catch (error) {
    console.error('❌ Hata:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()



