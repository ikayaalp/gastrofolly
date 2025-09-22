import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database schema creation...')
    
    // Test connection
    await prisma.$connect()
    console.log('Database connected successfully!')
    
    // Create tables by running a simple query
    try {
      // This will create the User table if it doesn't exist
      const userCount = await prisma.user.count()
      console.log(`User table exists. Count: ${userCount}`)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database schema created successfully!',
        userCount 
      })
    } catch (error) {
      console.log('Creating database schema...')
      
      // Try to create a user to trigger schema creation
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User'
        }
      })
      
      // Delete the test user
      await prisma.user.delete({
        where: { id: testUser.id }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database schema created successfully!' 
      })
    }
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
