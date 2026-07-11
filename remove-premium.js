const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function removePremium() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('Kullanım: node remove-premium.js email@example.com')
    process.exit(1)
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { 
        subscriptionPlan: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        subscriptionCancelled: true
      }
    })
    
    console.log(`✅ ${user.name || 'Kullanıcı'} (${user.email}) kullanıcısının premium üyeliği kaldırıldı.`)
  } catch (error) {
    console.error('❌ Hata:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

removePremium()
