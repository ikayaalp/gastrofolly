import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        const { question, options, days, title, content } = await request.json()

        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return NextResponse.json(
                { error: 'Invalid poll data' },
                { status: 400 }
            )
        }

        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(startDate.getDate() + (days || 1))

        // Create Topic with Poll
        // Use the default category or a specific one
        const defaultCategory = await prisma.forumCategory.findUnique({
            where: { slug: 'genel' }
        }) || await prisma.forumCategory.findFirst()

        if (!defaultCategory) {
            return NextResponse.json({ error: 'System error: No category found' }, { status: 500 })
        }

        // Unique Slug
        let slug = (title || question)
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim()

        let uniqueSlug = slug
        let counter = 1
        while (await prisma.topic.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${counter}`
            counter++
        }

        const topic = await prisma.topic.create({
            data: {
                title: title || question,
                content: content || 'Anket',
                slug: uniqueSlug,
                authorId: user.id,
                categoryId: defaultCategory.id,
                isPinned: true, // Auto-pin polls as requested "en başta gözüksün"
                poll: {
                    create: {
                        question,
                        startDate,
                        endDate,
                        options: {
                            create: options.map((opt: string) => ({ text: opt }))
                        }
                    }
                }
            },
            include: {
                poll: true
            }
        })

        return NextResponse.json(topic, { status: 201 })
    } catch (error) {
        console.error('Error creating poll:', error)
        return NextResponse.json(
            { error: 'Failed to create poll' },
            { status: 500 }
        )
    }
}
