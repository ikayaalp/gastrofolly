
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // 1. Fetch all topics
        const topics = await prisma.topic.findMany({
            select: {
                id: true,
                title: true,
                content: true
            }
        })

        let updatedCount = 0
        const logs: string[] = []

        // 2. Process each topic
        for (const topic of topics) {
            const content = topic.content || ''
            const title = topic.title || ''
            const fullText = `${title} ${content}`

            // Extract hashtags
            const hashtagRegex = /#([a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+)/g
            const hashtagsFound = Array.from(fullText.matchAll(hashtagRegex)).map(match => match[1].toLowerCase())
            const uniqueHashtags = [...new Set(hashtagsFound)]

            if (uniqueHashtags.length > 0) {
                // Connect/Create hashtags for this topic
                await prisma.topic.update({
                    where: { id: topic.id },
                    data: {
                        hashtags: {
                            connectOrCreate: uniqueHashtags.map(name => ({
                                where: { name },
                                create: { name }
                            }))
                        }
                    }
                })
                updatedCount++
                logs.push(`Topic "${topic.id}" updated with hashtags: ${uniqueHashtags.join(', ')}`)
            }
        }

        return NextResponse.json({
            message: 'Backfill completed',
            totalTopics: topics.length,
            updatedTopics: updatedCount,
            logs
        })
    } catch (error) {
        console.error('Backfill error:', error)
        return NextResponse.json(
            { error: 'Backfill failed', details: String(error) },
            { status: 500 }
        )
    }
}
