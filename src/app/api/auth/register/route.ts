import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validasyon
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Tüm alanlar gereklidir" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Şifre en az 6 karakter olmalıdır" },
        { status: 400 }
      )
    }

    // E-posta kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Bu e-posta adresi zaten kullanımda" },
        { status: 400 }
      )
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12)

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        // password: hashedPassword, // Şu an için password field'i yok, sonra ekleyeceğiz
      }
    })

    return NextResponse.json(
      { message: "Kullanıcı başarıyla oluşturuldu", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Kayıt hatası:", error)
    return NextResponse.json(
      { message: "Sunucu hatası" },
      { status: 500 }
    )
  }
}

