import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to create a slug
function generateSlug(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name } = body

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Kategori adı zorunludur" }, { status: 400 })
        }

        const baseSlug = generateSlug(name)
        let slug = baseSlug
        let counter = 1

        // Ensure slug is unique
        while (await prisma.category.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`
            counter++
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                slug,
            },
        })

        return NextResponse.json({ category }, { status: 201 })
    } catch (error) {
        console.error("Error creating category:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
