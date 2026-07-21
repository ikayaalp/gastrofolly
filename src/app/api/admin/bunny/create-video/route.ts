import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createBunnyVideo, getPresignedTusParams } from '@/lib/bunnyStream'

// Admin/eğitmen panelinden video yüklemek için: Bunny'de video objesi oluşturur ve
// tarayıcının doğrudan tus ile yükleyebilmesi için presigned parametreleri döndürür.
// API_KEY server'da kalır; tarayıcıya yalnızca imza gider.
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const role = (session?.user as any)?.role
        if (!session?.user || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled'

        const { guid } = await createBunnyVideo(title)
        const presigned = getPresignedTusParams(guid)

        return NextResponse.json({
            videoId: guid,
            endpoint: presigned.endpoint,
            libraryId: presigned.libraryId,
            expiration: presigned.expiration,
            signature: presigned.signature,
        })
    } catch (error) {
        console.error('[Bunny create-video]', error)
        return NextResponse.json({ error: 'Video oluşturulamadı' }, { status: 500 })
    }
}
