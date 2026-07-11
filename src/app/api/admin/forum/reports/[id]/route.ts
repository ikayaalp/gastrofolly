import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteForumTopic, deleteForumPost } from '@/lib/forumDelete'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        const { id } = await params
        const { action } = await request.json()

        if (action !== 'DISMISS' && action !== 'REMOVE') {
            return NextResponse.json(
                { error: 'Invalid action. Must be DISMISS or REMOVE' },
                { status: 400 }
            )
        }

        // Fetch the report to see what we are acting upon
        const report = await prisma.report.findUnique({
            where: { id }
        })

        if (!report) {
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            )
        }

        if (action === 'DISMISS') {
            const updatedReport = await prisma.report.update({
                where: { id },
                data: {
                    status: 'REVIEWED_DISMISSED',
                    reviewedAt: new Date(),
                    reviewedBy: session.user.id
                }
            })
            return NextResponse.json({ success: true, report: updatedReport })
        }

        if (action === 'REMOVE') {
            let deleted = true

            // Try to delete the target content
            if (report.topicId) {
                deleted = await deleteForumTopic(report.topicId)
            } else if (report.postId) {
                deleted = await deleteForumPost(report.postId)
            }

            // Even if content is already deleted or not found, update the report
            const updatedReport = await prisma.report.update({
                where: { id },
                data: {
                    status: 'REVIEWED_REMOVED',
                    reviewedAt: new Date(),
                    reviewedBy: session.user.id
                }
            })

            return NextResponse.json({
                success: true,
                report: updatedReport,
                contentDeleted: deleted
            })
        }

    } catch (error) {
        console.error('Error updating report:', error)
        return NextResponse.json(
            { error: 'Failed to process report' },
            { status: 500 }
        )
    }
}
