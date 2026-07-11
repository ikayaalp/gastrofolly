const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function makePremium() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('Kullanım: node make-premium.js email@example.com')
    process.exit(1)
  }

  try {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const user = await prisma.user.update({
      where: { email },
      data: { 
        subscriptionPlan: 'Executive',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: nextYear,
        subscriptionCancelled: false
      }
    })
    
    console.log(`✅ ${user.name || 'Kullanıcı'} (${user.email}) artık premium (Executive planı aktif)! Bitiş: ${user.subscriptionEndDate}`)
  } catch (error) {
    console.error('❌ Hata:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

makePremium()
