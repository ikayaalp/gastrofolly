// Server-only Bunny Stream yardımcıları.
// Gizli anahtarlar (BUNNY_STREAM_API_KEY, BUNNY_STREAM_TOKEN_KEY) YALNIZCA burada
// ve bunu import eden server route'larında okunur; asla client bundle'ına girmez.
import crypto from 'crypto'

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || ''
const API_KEY = process.env.BUNNY_STREAM_API_KEY || ''
const TOKEN_KEY = process.env.BUNNY_STREAM_TOKEN_KEY || ''
const CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME || ''

const VIDEO_API_BASE = 'https://video.bunnycdn.com'
const TUS_ENDPOINT = 'https://video.bunnycdn.com/tusupload'

/** Bir Bunny değerinin YouTube URL'i mi yoksa Bunny GUID mi olduğunu ayırt eder. */
export function isYouTubeUrl(value: string): boolean {
    return value.includes('youtube.com') || value.includes('youtu.be')
}

/**
 * Bunny Stream'de yeni bir video objesi oluşturur ve GUID'ini döndürür.
 * API_KEY server-side "AccessKey" header'ı ile gönderilir.
 */
export async function createBunnyVideo(title: string): Promise<{ guid: string }> {
    if (!LIBRARY_ID || !API_KEY) throw new Error('Bunny Stream env değişkenleri eksik')

    const res = await fetch(`${VIDEO_API_BASE}/library/${LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            AccessKey: API_KEY,
        },
        body: JSON.stringify({ title }),
    })

    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Bunny create video başarısız (${res.status}): ${body}`)
    }

    const data = await res.json()
    if (!data?.guid) throw new Error('Bunny create video: guid dönmedi')
    return { guid: data.guid as string }
}

/**
 * Tarayıcının doğrudan Bunny'ye (tus resumable) yükleme yapabilmesi için presigned
 * parametreler üretir. API_KEY server'da kalır; tarayıcı sadece imzayı görür.
 *
 * Doğrulanmış algoritma (Bunny resmi tus dokümanı):
 *   signature = SHA256_HEX(library_id + api_key + expiration + video_id)
 *   expiration = UNIX SANİYE.
 */
export function getPresignedTusParams(videoId: string, ttlSeconds = 3600) {
    if (!LIBRARY_ID || !API_KEY) throw new Error('Bunny Stream env değişkenleri eksik')

    const expiration = Math.floor(Date.now() / 1000) + ttlSeconds
    const signature = crypto
        .createHash('sha256')
        .update(`${LIBRARY_ID}${API_KEY}${expiration}${videoId}`)
        .digest('hex')

    return {
        endpoint: TUS_ENDPOINT,
        libraryId: LIBRARY_ID,
        videoId,
        expiration, // AuthorizationExpire header'ında birebir aynı değer gönderilmeli
        signature,  // AuthorizationSignature
    }
}

/**
 * Token-authenticated (imzalı) HLS playback URL üretir. HLS olduğu için DİZİN
 * (/{guid}/) imzalanır ki playlist.m3u8 VE altındaki tüm .ts segmentleri yetkili olsun
 * (Bunny "token_path" / directory token).
 *
 * ⚠️ CANLI DOĞRULAMA GEREKİR: Bunny'nin iki token-auth versiyonu var.
 *   Burada V1 uygulandı:  token = urlsafe_base64( SHA256_RAW(TOKEN_KEY + token_path + expires) )
 *   URL: https://host/{guid}/playlist.m3u8?token=...&expires=...&token_path=/{guid}/
 * Eğer gerçek test videosunda 401 alınırsa: (a) hash girdisini tam dosya yoluyla dene,
 *   (b) V2'ye geç: token = "HS256-" + base64url( HMAC-SHA256(TOKEN_KEY, path+expires) ).
 * Değişiklik yalnızca bu fonksiyonda izole; çağıranlar etkilenmez.
 */
export function getSignedPlaybackUrl(guid: string, ttlSeconds = 6 * 60 * 60): { url: string; expiresAt: number } {
    if (!CDN_HOSTNAME || !TOKEN_KEY) throw new Error('Bunny Stream env değişkenleri eksik')

    const expires = Math.floor(Date.now() / 1000) + ttlSeconds
    const tokenPath = `/${guid}/`
    const filePath = `${tokenPath}playlist.m3u8`

    const token = crypto
        .createHash('sha256')
        .update(`${TOKEN_KEY}${tokenPath}${expires}`)
        .digest('base64')
        .replace(/\n/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    const url =
        `https://${CDN_HOSTNAME}${filePath}` +
        `?token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}`

    return { url, expiresAt: expires }
}
