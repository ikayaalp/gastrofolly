import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateForumSlug } from "../route"

export async function PUT(req: Request, { params }: { params: Promise<{ categoryId: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { categoryId } = await params
        const body = await req.json()
        const { name, description, color } = body

        const existing = await prisma.forumCategory.findUnique({ where: { id: categoryId } })
        if (!existing) {
            return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
        }

        let slug = existing.slug
        if (name && name.trim() !== existing.name) {
            const baseSlug = generateForumSlug(name)
            slug = baseSlug
            let counter = 1
            while (await prisma.forumCategory.findFirst({ where: { slug, NOT: { id: categoryId } } })) {
                slug = `${baseSlug}-${counter}`
                counter++
            }
        }

        const category = await prisma.forumCategory.update({
            where: { id: categoryId },
            data: {
                ...(name && { name: name.trim(), slug }),
                description: description ?? existing.description,
                color: color ?? existing.color,
            },
        })

        return NextResponse.json({ category }, { status: 200 })
    } catch (error) {
        console.error("Error updating forum category:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ categoryId: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { categoryId } = await params

        const existing = await prisma.forumCategory.findUnique({
            where: { id: categoryId },
            include: { _count: { select: { topics: true } } }
        })

        if (!existing) {
            return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
        }

        if (existing._count.topics > 0) {
            return NextResponse.json(
                { error: `Bu kategoriye bağlı ${existing._count.topics} başlık var. Önce başlıkları başka bir kategoriye taşıyın.` },
                { status: 400 }
            )
        }

        await prisma.forumCategory.delete({ where: { id: categoryId } })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Error deleting forum category:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
