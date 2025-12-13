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

    const { name, image, phoneNumber } = await request.json()

    // Email artık değiştirilemez, sadece name, phoneNumber ve image güncellenir
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || null,
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
