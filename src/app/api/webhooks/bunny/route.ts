import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Bunny Webhook Endpoint
// URL: https://culinora.net/api/webhooks/bunny?token=<YOUR_SECURE_TOKEN>
export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        // Basit bir token doğrulaması
        if (token !== process.env.BUNNY_WEBHOOK_TOKEN) {
            console.warn('[Bunny Webhook] Unauthorized request')
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        
        // Bunny webhook payload — video status kodları:
        // 0 Created, 1 Uploaded, 2 Processing, 3 Transcoding, 4 Finished, 5 Error
        // Encode tamamlandığında (4 = Finished) gerçek süreyi çekiyoruz.
        
        const videoGuid = body.VideoGuid
        const status = body.Status
        
        console.log(`[Bunny Webhook] Received event for Video: ${videoGuid}, Status: ${status}`)

        // Eğer video işleme tamamlandıysa veya yükleme bittiyse süresini güncelleyebiliriz
        if (status === 4 && videoGuid) {
            // Bunny API'den video detaylarını çekerek gerçek süreyi öğreniyoruz
            const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID
            const apiKey = process.env.BUNNY_STREAM_API_KEY
            
            if (!libraryId || !apiKey) {
                console.error('[Bunny Webhook] Missing Bunny API credentials')
                return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 500 })
            }

            const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`, {
                method: 'GET',
                headers: {
                    'AccessKey': apiKey,
                    'accept': 'application/json'
                }
            })

            if (response.ok) {
                const videoData = await response.json()
                const durationInSeconds = videoData.length || 0 // Bunny often returns 'length' as duration in seconds
                
                if (durationInSeconds > 0) {
                    // Dakikaya çevirip yukarı yuvarla
                    const durationInMinutes = Math.ceil(durationInSeconds / 60)
                    
                    console.log(`[Bunny Webhook] Video ${videoGuid} duration: ${durationInSeconds}s (${durationInMinutes}m)`)

                    // Bu video URL'sine (guid) sahip dersleri bul ve süresini güncelle
                    await prisma.lesson.updateMany({
                        where: { videoUrl: videoGuid },
                        data: { duration: durationInMinutes }
                    })
                    
                    console.log(`[Bunny Webhook] Lessons with video ${videoGuid} updated successfully.`)
                } else {
                    console.log(`[Bunny Webhook] Video ${videoGuid} length is 0, skipping duration update.`)
                }
            } else {
                console.error(`[Bunny Webhook] Failed to fetch video details from Bunny API: ${response.statusText}`)
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Bunny Webhook] Error:', error)
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
    }
}
