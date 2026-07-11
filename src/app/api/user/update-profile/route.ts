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

    const { name, username, image, phoneNumber, bio, coverImage } = await request.json()

    // Email artık değiştirilemez, sadece name, username, phoneNumber, image, bio ve coverImage güncellenir
    const updateData: any = {}
    if (name !== undefined) updateData.name = name || null
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null
    if (image !== undefined) updateData.image = image || null
    if (bio !== undefined) updateData.bio = bio || null
    if (coverImage !== undefined) updateData.coverImage = coverImage || null

    if (username !== undefined && username !== null) {
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (cleanUsername.length < 3) {
        return NextResponse.json({ error: "Kullanıcı adı en az 3 karakter olmalıdır" }, { status: 400 })
      }
      
      const existingUser = await prisma.user.findUnique({
        where: { username: cleanUsername }
      })

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış" }, { status: 400 })
      }
      
      updateData.username = cleanUsername
    }

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
