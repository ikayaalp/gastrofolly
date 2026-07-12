import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''

        const hashtags = await prisma.hashtag.findMany({
            where: search
                ? { name: { contains: search, mode: 'insensitive' } }
                : undefined,
            include: {
                _count: { select: { topics: true } }
            },
            orderBy: { topics: { _count: 'desc' } }
        })

        return NextResponse.json({ data: hashtags }, { status: 200 })
    } catch (error) {
        console.error("Error fetching hashtags:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: "id parametresi zorunludur" }, { status: 400 })
        }

        const existing = await prisma.hashtag.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: "Hashtag bulunamadı" }, { status: 404 })
        }

        // Prisma ilişkileri (TopicHashtags junction) otomatik temizler
        await prisma.hashtag.delete({ where: { id } })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Error deleting hashtag:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
