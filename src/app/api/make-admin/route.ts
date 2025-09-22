import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email gerekli" }, { status: 400 })
    }

    // Kullanıcıyı admin yap
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    })

    return NextResponse.json({ 
      success: true, 
      message: `${email} admin yapıldı`,
      user: { id: user.id, email: user.email, role: user.role }
    })

  } catch (error) {
    console.error("Make admin error:", error)
    return NextResponse.json(
      { error: "Admin yapılırken hata oluştu" },
      { status: 500 }
    )
  }
}
