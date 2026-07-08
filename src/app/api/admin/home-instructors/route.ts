import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Tüm vitrin eğitmenlerini listele (admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const instructors = await prisma.homeInstructor.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })

    return NextResponse.json(instructors)
  } catch (error) {
    console.error("[HOME_INSTRUCTORS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Yeni eğitmen ekle
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, subtitle, imageUrl, linkUrl, order, isActive } = await req.json()

    if (!name || !name.trim()) {
      return new NextResponse("name zorunludur", { status: 400 })
    }

    const instructor = await prisma.homeInstructor.create({
      data: {
        name: name.trim(),
        subtitle: subtitle || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        order: typeof order === "number" ? order : 0,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(instructor)
  } catch (error) {
    console.error("[HOME_INSTRUCTORS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Eğitmen güncelle (body.id ile)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id, name, subtitle, imageUrl, linkUrl, order, isActive } = await req.json()

    if (!id) {
      return new NextResponse("id zorunludur", { status: 400 })
    }

    const instructor = await prisma.homeInstructor.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(subtitle !== undefined ? { subtitle: subtitle || null } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
        ...(linkUrl !== undefined ? { linkUrl: linkUrl || null } : {}),
        ...(order !== undefined ? { order } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })

    return NextResponse.json(instructor)
  } catch (error) {
    console.error("[HOME_INSTRUCTORS_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Eğitmen sil (?id=)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return new NextResponse("id zorunludur", { status: 400 })
    }

    await prisma.homeInstructor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[HOME_INSTRUCTORS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
