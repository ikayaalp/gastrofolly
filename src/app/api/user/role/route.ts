import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ role: null }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        return NextResponse.json({ role: user?.role || 'STUDENT' })
    } catch (error) {
        console.error('Error getting user role:', error)
        return NextResponse.json({ role: 'STUDENT' }, { status: 500 })
    }
}
