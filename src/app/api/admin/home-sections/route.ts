import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { resolveHomeSections, HOME_SECTION_KEYS } from "@/lib/homeSections"

// Bölümleri (varsayılanlarla birleştirilmiş) listele — admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const dbSections = await prisma.homeSection.findMany()
    return NextResponse.json(resolveHomeSections(dbSections))
  } catch (error) {
    console.error("[HOME_SECTIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Bölüm sırası/görünürlüğünü toplu güncelle.
// body: { sections: { key, order, isVisible, label? }[] }
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { sections } = await req.json()

    if (!Array.isArray(sections)) {
      return new NextResponse("sections dizisi zorunludur", { status: 400 })
    }

    const valid = sections.filter((s) => HOME_SECTION_KEYS.includes(s?.key))

    await prisma.$transaction(
      valid.map((s: { key: string; label?: string; order: number; isVisible: boolean }) =>
        prisma.homeSection.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            label: s.label || s.key,
            order: s.order ?? 0,
            isVisible: s.isVisible ?? true,
          },
          update: {
            order: s.order ?? 0,
            isVisible: s.isVisible ?? true,
            ...(s.label ? { label: s.label } : {}),
          },
        })
      )
    )

    const dbSections = await prisma.homeSection.findMany()
    return NextResponse.json(resolveHomeSections(dbSections))
  } catch (error) {
    console.error("[HOME_SECTIONS_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
