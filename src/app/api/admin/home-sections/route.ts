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

    const dbSections = await prisma.homeSection.findMany({
      include: {
        courses: {
          orderBy: { order: "asc" }
        }
      }
    })
    return NextResponse.json(resolveHomeSections(dbSections))
  } catch (error) {
    console.error("[HOME_SECTIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Bölüm sırası/görünürlüğünü toplu güncelle.
// body: { sections: { key, order, isVisible, label?, isCustom?, courseIds? }[] }
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

    const valid = sections.filter(
      (s) => HOME_SECTION_KEYS.includes(s?.key) || s?.isCustom || s?.key?.startsWith("custom-")
    )

    await prisma.$transaction(async (tx) => {
      // 1. Gelen tüm sectionları upsert et
      for (const s of valid) {
        const isCustom = Boolean(s.isCustom || s.key.startsWith("custom-"))
        
        const section = await tx.homeSection.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            label: s.label || s.key,
            order: s.order ?? 0,
            isVisible: s.isVisible ?? true,
            isCustom: isCustom,
          },
          update: {
            order: s.order ?? 0,
            isVisible: s.isVisible ?? true,
            ...(s.label ? { label: s.label } : {}),
            isCustom: isCustom,
          },
        })

        // Özel bölümse ve kurs listesi gelmişse, kurs ilişkilerini senkronize et
        if (isCustom && Array.isArray(s.courseIds)) {
          // Eski kursları temizle
          await tx.homeSectionCourse.deleteMany({
            where: { homeSectionId: section.id }
          })
          
          // Yeni kursları ekle (sırayla)
          if (s.courseIds.length > 0) {
            await tx.homeSectionCourse.createMany({
              data: s.courseIds.map((courseId: string, idx: number) => ({
                homeSectionId: section.id,
                courseId: courseId,
                order: idx
              }))
            })
          }
        }
      }

      // 2. Silinmiş olan özel bölümleri bul ve DB'den temizle
      const incomingKeys = valid.map((s) => s.key)
      await tx.homeSection.deleteMany({
        where: {
          isCustom: true,
          key: { notIn: incomingKeys }
        }
      })
    })

    const dbSections = await prisma.homeSection.findMany({
      include: { courses: { orderBy: { order: "asc" } } }
    })
    return NextResponse.json(resolveHomeSections(dbSections))
  } catch (error) {
    console.error("[HOME_SECTIONS_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
