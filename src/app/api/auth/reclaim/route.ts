import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Kullanıcının sistemde hala var olup olmadığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 401 }
      );
    }

    // Yeni bir session ID oluştur ve veritabanına kaydet
    const newSessionId = randomUUID();
    
    await prisma.user.update({
      where: { id: user.id },
      data: { currentSessionId: newSessionId }
    });

    return NextResponse.json({
      success: true,
      newSessionId
    });
  } catch (error) {
    console.error('Session reclaim error:', error);
    return NextResponse.json(
      { success: false, message: 'Oturum yenilenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
