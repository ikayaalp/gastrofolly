import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Tüm kapakları listele (admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const covers = await prisma.homeCover.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })

    return NextResponse.json(covers)
  } catch (error) {
    console.error("[HOME_COVERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Yeni kapak ekle
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { imageUrl, title, subtitle, linkUrl, order, isActive } = await req.json()

    if (!imageUrl) {
      return new NextResponse("imageUrl zorunludur", { status: 400 })
    }

    const cover = await prisma.homeCover.create({
      data: {
        imageUrl,
        title: title || null,
        subtitle: subtitle || null,
        linkUrl: linkUrl || null,
        order: typeof order === "number" ? order : 0,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(cover)
  } catch (error) {
    console.error("[HOME_COVERS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Kapak güncelle (body.id ile)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id, imageUrl, title, subtitle, linkUrl, order, isActive } = await req.json()

    if (!id) {
      return new NextResponse("id zorunludur", { status: 400 })
    }

    const cover = await prisma.homeCover.update({
      where: { id },
      data: {
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(title !== undefined ? { title: title || null } : {}),
        ...(subtitle !== undefined ? { subtitle: subtitle || null } : {}),
        ...(linkUrl !== undefined ? { linkUrl: linkUrl || null } : {}),
        ...(order !== undefined ? { order } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })

    return NextResponse.json(cover)
  } catch (error) {
    console.error("[HOME_COVERS_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Kapak sil (?id=)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return new NextResponse("id zorunludur", { status: 400 })
    }

    await prisma.homeCover.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[HOME_COVERS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
