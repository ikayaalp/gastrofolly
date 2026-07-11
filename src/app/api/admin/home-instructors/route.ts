import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

// Tüm vitrin eğitmenlerini listele (admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
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

// Yeni eğitmen oluştur — hem gerçek User (role=INSTRUCTOR) hem vitrin kaydı
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { name, email, password, subtitle, imageUrl, linkUrl, order, isActive } = await req.json()

    if (!name || !name.trim()) {
      return new NextResponse("İsim zorunludur", { status: 400 })
    }
    if (!email || !email.trim()) {
      return new NextResponse("E-posta zorunludur", { status: 400 })
    }
    if (!password || password.length < 6) {
      return new NextResponse("Şifre en az 6 karakter olmalıdır", { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // E-posta zaten kayıtlı mı?
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return new NextResponse("Bu e-posta zaten kayıtlı", { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // User + HomeInstructor'ı atomik oluştur
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "INSTRUCTOR",
          emailVerified: new Date(), // anında giriş yapabilsin
          image: imageUrl || null,
        },
      })

      const instructor = await tx.homeInstructor.create({
        data: {
          name: name.trim(),
          subtitle: subtitle || null,
          imageUrl: imageUrl || null,
          linkUrl: linkUrl || `/instructor/${user.id}`,
          order: typeof order === "number" ? order : 0,
          isActive: isActive ?? true,
          userId: user.id,
          email: normalizedEmail,
        },
      })

      return instructor
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[HOME_INSTRUCTORS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Eğitmen güncelle (body.id ile). Bağlı hesabın adı/görseli senkronlanır, şifre opsiyonel sıfırlanır.
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id, name, subtitle, imageUrl, linkUrl, order, isActive, password } = await req.json()

    if (!id) {
      return new NextResponse("id zorunludur", { status: 400 })
    }
    if (password && password.length < 6) {
      return new NextResponse("Şifre en az 6 karakter olmalıdır", { status: 400 })
    }

    const current = await prisma.homeInstructor.findUnique({ where: { id } })
    if (!current) {
      return new NextResponse("Kayıt bulunamadı", { status: 404 })
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

    // Bağlı gerçek hesabı senkronla (ad, görsel, opsiyonel şifre)
    if (current.userId) {
      const userData = {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(imageUrl !== undefined ? { image: imageUrl || null } : {}),
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      }

      if (Object.keys(userData).length > 0) {
        await prisma.user.update({ where: { id: current.userId }, data: userData })
      }
    }

    return NextResponse.json(instructor)
  } catch (error) {
    console.error("[HOME_INSTRUCTORS_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Eğitmen sil (?id=). Bağlı hesabı da siler; hesabın kursu varsa silinmez (bilgilendirilir).
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

    const current = await prisma.homeInstructor.findUnique({ where: { id } })
    if (!current) {
      return new NextResponse("Kayıt bulunamadı", { status: 404 })
    }

    // Önce bağlı hesabı silmeyi dene (kursu varsa Prisma engeller)
    if (current.userId) {
      const courseCount = await prisma.course.count({ where: { instructorId: current.userId } })
      if (courseCount > 0) {
        return new NextResponse(
          "Bu eğitmenin kursları var. Önce kursları silin veya başka eğitmene aktarın.",
          { status: 409 }
        )
      }
      await prisma.user.delete({ where: { id: current.userId } })
    }

    await prisma.homeInstructor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[HOME_INSTRUCTORS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
