import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

// Başka cihaz tarafından devralınmış web oturumunu geri alır ("Kim İzliyor?").
// ConcurrentLogin durumunda session callback kimliği söktüğü için getServerSession
// KULLANILAMAZ; kimlik doğrudan imzalı cookie JWT'sinden (getToken) okunur.
// Cookie JWT'si hâlâ bu cihazda yapılmış gerçek bir girişin ürünüdür — şifre
// bypass'ı yoktur, yalnızca sessionId eşleşme kontrolü atlanır.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`web-reclaim:${ip}`, RATE_LIMITS.AUTH)).success) {
      return NextResponse.json(
        { success: false, message: 'Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    const token = await getToken({ req });

    if (!token?.sub) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Kullanıcının sistemde hala var olup olmadığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 401 }
      );
    }

    // Yeni bir session ID oluştur ve veritabanına kaydet — karşı cihaz düşer.
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
