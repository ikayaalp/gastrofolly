import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/app/api/admin/categories/route"

// Re-export so [categoryId]/route.ts can import it from here
export { generateSlug as generateForumSlug }

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const categories = await prisma.forumCategory.findMany({
            include: {
                _count: { select: { topics: true } }
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json({ data: categories }, { status: 200 })
    } catch (error) {
        console.error("Error fetching forum categories:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, description, color } = body

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Kategori adı zorunludur" }, { status: 400 })
        }

        const baseSlug = generateForumSlug(name)
        let slug = baseSlug
        let counter = 1

        while (await prisma.forumCategory.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`
            counter++
        }

        const category = await prisma.forumCategory.create({
            data: {
                name: name.trim(),
                slug,
                description: description || null,
                color: color || null,
            },
        })

        return NextResponse.json({ category }, { status: 201 })
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: "Bu isimde bir kategori zaten var" }, { status: 409 })
        }
        console.error("Error creating forum category:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
