const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration for Premium Yıllık users...");
  const users = await prisma.user.findMany({
    where: {
      subscriptionPlan: 'Premium Yıllık'
    }
  });
  
  console.log(`Found ${users.length} users with 'Premium Yıllık'`);

  if (users.length > 0) {
    const result = await prisma.user.updateMany({
      where: {
        subscriptionPlan: 'Premium Yıllık'
      },
      data: {
        subscriptionPlan: 'Premium',
        subscriptionBillingPeriod: 'YEARLY'
      }
    });
    console.log(`Updated ${result.count} users successfully.`);
  } else {
    console.log("No users needed migration.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
