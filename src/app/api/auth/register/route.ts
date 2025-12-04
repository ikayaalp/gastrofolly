import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateVerificationCode, sendVerificationEmail, getCodeExpiry } from "@/lib/emailService"
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
      // Eğer kullanıcı var ve emailVerified ise hata döndür
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { message: "Bu e-posta adresi zaten kullanımda" },
          { status: 400 }
        )
      }

      // Eğer kullanıcı var ama email doğrulanmamışsa, kodu güncelle ve tekrar gönder
      const verificationCode = generateVerificationCode()
      const codeExpiry = getCodeExpiry()
      const hashedPassword = await bcrypt.hash(password, 12)

      await prisma.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          verificationCode,
          verificationCodeExpiry: codeExpiry
        }
      })

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
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12)

    // 6 haneli doğrulama kodu oluştur
    const verificationCode = generateVerificationCode()
    const codeExpiry = getCodeExpiry()

    // Kullanıcıyı veritabanına kaydet (emailVerified=null ile)
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpiry: codeExpiry,
        emailVerified: null // Henüz doğrulanmamış
      }
    })

    // Doğrulama emaili gönder
    const emailSent = await sendVerificationEmail(email, verificationCode, name)

    if (!emailSent) {
      // Email gönderilemezse kullanıcıyı sil
      await prisma.user.delete({ where: { email } })
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
