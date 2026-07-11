import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "../route"

export async function PUT(req: Request, { params }: { params: Promise<{ categoryId: string }> }) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { categoryId } = await params
        const body = await req.json()
        const { name, description, imageUrl } = body

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Kategori adı zorunludur" }, { status: 400 })
        }

        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId }
        })

        if (!existingCategory) {
            return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
        }

        let slug = existingCategory.slug
        if (name.trim() !== existingCategory.name) {
            const baseSlug = generateSlug(name)
            slug = baseSlug
            let counter = 1
            while (await prisma.category.findUnique({ where: { slug, NOT: { id: categoryId } } })) {
                slug = `${baseSlug}-${counter}`
                counter++
            }
        }

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: {
                name: name.trim(),
                slug,
                description: description || null,
                imageUrl: imageUrl || null
            },
        })

        return NextResponse.json({ category }, { status: 200 })
    } catch (error) {
        console.error("Error updating category:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ categoryId: string }> }) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { categoryId } = await params
        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: { courses: true }
                }
            }
        })

        if (!existingCategory) {
            return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
        }

        if (existingCategory._count.courses > 0) {
            return NextResponse.json(
                { error: `Bu kategoriye bağlı ${existingCategory._count.courses} kurs var, önce onları başka bir kategoriye taşıyın.` },
                { status: 400 }
            )
        }

        await prisma.category.delete({
            where: { id: categoryId }
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Error deleting category:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
