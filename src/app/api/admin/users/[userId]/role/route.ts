import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    // Admin kontrolü
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const { role } = await request.json()

    // Geçerli rol kontrolü
    const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Kullanıcının kendi rolünü değiştirmesini engelle
    if (session.user.id === userId) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({ 
      message: 'Role updated successfully',
      user: updatedUser 
    })

  } catch (error) {
    console.error('Role update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
