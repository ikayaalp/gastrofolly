import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // En çok konuya (topic) sahip 5 hashtagi getir
        const trendingHashtags = await (prisma as any).hashtag.findMany({
            take: 5,
            include: {
                _count: {
                    select: {
                        topics: true
                    }
                }
            },
            orderBy: {
                topics: {
                    _count: 'desc'
                }
            }
        })

        return NextResponse.json({
            hashtags: trendingHashtags.map((h: any) => ({
                id: h.id,
                name: h.name,
                count: h._count.topics
            }))
        })
    } catch (error) {
        console.error('Error fetching trending hashtags:', error)
        return NextResponse.json(
            { error: 'Failed to fetch hashtags' },
            { status: 500 }
        )
    }
}
