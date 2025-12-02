const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Starting migration: Resetting Enrollments and Payments...')

    try {
        // Delete all payments first (due to foreign key constraints if any, though usually enrollment depends on user/course)
        // Actually Enrollment and Payment are independent usually, but let's be safe.

        const deletedPayments = await prisma.payment.deleteMany({})
        console.log(`Deleted ${deletedPayments.count} payments.`)

        const deletedEnrollments = await prisma.enrollment.deleteMany({})
        console.log(`Deleted ${deletedEnrollments.count} enrollments.`)

        console.log('Migration completed successfully.')
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
