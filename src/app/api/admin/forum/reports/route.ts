import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)

        if (!user || user.role !== 'ADMIN') {
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

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request)

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        const { id, status } = await request.json()

        if (!id || !status) {
            return NextResponse.json(
                { error: 'Missing id or status' },
                { status: 400 }
            )
        }

        const updatedReport = await prisma.report.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json({ success: true, report: updatedReport })
    } catch (error) {
        console.error('Error updating report:', error)
        return NextResponse.json(
            { error: 'Failed to update report' },
            { status: 500 }
        )
    }
}
