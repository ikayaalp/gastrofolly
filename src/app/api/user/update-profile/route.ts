import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
    }

    const { name, email, image, phoneNumber } = await request.json()

    // E-posta değişikliği kontrolü
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kullanılıyor" }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || null,
        email,
        phoneNumber: phoneNumber || null,
        image: image || null
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profil başarıyla güncellendi"
    })

  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Profil güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}
