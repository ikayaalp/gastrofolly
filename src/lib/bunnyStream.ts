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
 * Token-authenticated (imzalı) HLS playback URL üretir — PATH-EMBEDDED directory token.
 *
 * HLS'te master playlist alt-playlist/segmentleri RELATIVE referans eder ve query-string
 * token'ı miras almaz → query token ile segmentler 403 alır. Çözüm: token'ı PATH'e gömmek.
 * Böylece player relative URL'i çözerken token prefix'ini korur ve token_path=/{guid}/
 * tüm dizini (alt-playlistler + .ts segmentleri) yetkilendirir.
 *
 *   token = urlsafe_base64( SHA256_RAW(TOKEN_KEY + tokenPath + expires) )
 *   URL:   https://host/bcdn_token={token}&expires={exp}&token_path=/{guid}/playlist.m3u8
 *
 * Gerçek Bunny endpoint'ine karşı uçtan uca doğrulandı: master 200 + relative alt-playlist 200.
 */
export function getSignedPlaybackUrl(guid: string, ttlSeconds = 6 * 60 * 60): { url: string; expiresAt: number } {
    if (!CDN_HOSTNAME || !TOKEN_KEY) throw new Error('Bunny Stream env değişkenleri eksik')

    const expires = Math.floor(Date.now() / 1000) + ttlSeconds
    const tokenPath = `/${guid}/`

    const token = crypto
        .createHash('sha256')
        .update(`${TOKEN_KEY}${tokenPath}${expires}`)
        .digest('base64')
        .replace(/\n/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    // realpath (playlist.m3u8) token_path'in hemen ardına eklenir; relative alt-URL'ler
    // bu prefix'e göre çözülür.
    const url = `https://${CDN_HOSTNAME}/bcdn_token=${token}&expires=${expires}&token_path=${tokenPath}playlist.m3u8`

    return { url, expiresAt: expires }
}
