import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  try {
    // Hem Mobile (JWT) hem Web (Session) desteği
    const user = await getAuthUser(request)

    if (!user?.id) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
    }

    const { name, image, phoneNumber } = await request.json()

    // Email artık değiştirilemez, sadece name, phoneNumber ve image güncellenir
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
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
