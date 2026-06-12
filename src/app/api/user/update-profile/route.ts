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

    const { name, image, phoneNumber, bio } = await request.json()

    // Email artık değiştirilemez, sadece name, phoneNumber, image ve bio güncellenir
    const updateData: any = {}
    if (name !== undefined) updateData.name = name || null
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null
    if (image !== undefined) updateData.image = image || null
    if (bio !== undefined) updateData.bio = bio || null

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
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
