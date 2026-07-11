import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const status = searchParams.get('status') || 'PENDING'
        const skip = (page - 1) * limit

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where: { status },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    reporter: { select: { id: true, name: true, email: true } },
                    topic: { select: { id: true, title: true } },
                    post: { select: { id: true, content: true } }
                }
            }),
            prisma.report.count({ where: { status } })
        ])

        return NextResponse.json({
            reports,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        })
    } catch (error) {
        console.error('Error fetching reports:', error)
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        )
    }
}
