import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateVerificationCode, sendVerificationEmail, getCodeExpiry } from "@/lib/emailService"
import { addPendingUser } from "@/lib/pendingUsers"
import { validatePassword } from "@/lib/passwordValidator"

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

    // Güçlü şifre kontrolü
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { message: passwordValidation.errors.join(', ') },
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

    // 6 haneli doğrulama kodu oluştur
    const verificationCode = generateVerificationCode()
    const codeExpiry = getCodeExpiry()

    // ⚠️ Kullanıcıyı GEÇİCİ storage'a kaydet (Prisma'ya değil!)
    addPendingUser(email, {
      name,
      email,
      password: hashedPassword,
      verificationCode,
      codeExpiry,
      createdAt: new Date()
    })

    // Doğrulama emaili gönder
    const emailSent = await sendVerificationEmail(email, verificationCode, name)

    if (!emailSent) {
      return NextResponse.json(
        { message: "Email gönderilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: "Doğrulama kodu e-posta adresinize gönderildi", 
        email: email,
        requiresVerification: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Kayıt hatası:", error)
    return NextResponse.json(
      { message: "Sunucu hatası" },
      { status: 500 }
    )
  }
}

