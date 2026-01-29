import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { pollId, optionId } = await request.json()

        if (!pollId || !optionId) {
            return NextResponse.json(
                { error: 'Poll ID and Option ID are required' },
                { status: 400 }
            )
        }

        // Check if poll exists and is active
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                votes: {
                    where: { userId: user.id }
                }
            }
        })

        if (!poll) {
            return NextResponse.json(
                { error: 'Poll not found' },
                { status: 404 }
            )
        }

        if (new Date() > new Date(poll.endDate)) {
            return NextResponse.json(
                { error: 'Poll has ended' },
                { status: 400 }
            )
        }

        if (poll.votes.length > 0) {
            // Already voted, update the vote
            await prisma.pollVote.update({
                where: {
                    id: poll.votes[0].id
                },
                data: {
                    optionId
                }
            })
        } else {
            // Create new vote
            await prisma.pollVote.create({
                data: {
                    userId: user.id,
                    pollId,
                    optionId
                }
            })
        }

        return NextResponse.json({ success: true }, { status: 201 })
    } catch (error) {
        console.error('Error voting in poll:', error)
        return NextResponse.json(
            { error: 'Failed to vote' },
            { status: 500 }
        )
    }
}
