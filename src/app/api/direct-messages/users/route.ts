import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mesajlaşabilecek kullanıcıları getir (Chef'ler)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Chef'leri getir (INSTRUCTOR rolündeki kullanıcılar)
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        id: {
          not: session.user.id // Kendini hariç tut
        },
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        createdCourses: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          },
          take: 3
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ instructors })
  } catch (error) {
    console.error('Error fetching instructors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    )
  }
}
