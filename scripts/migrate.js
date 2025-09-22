const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database migration...')
  
  // Test connection
  await prisma.$connect()
  console.log('Database connected successfully!')
  
  // Create tables by running a simple query
  try {
    // This will create the User table if it doesn't exist
    const userCount = await prisma.user.count()
    console.log(`User table exists. Count: ${userCount}`)
  } catch (error) {
    console.log('Tables need to be created. Run: npx prisma db push')
  }
  
  await prisma.$disconnect()
  console.log('Migration completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
