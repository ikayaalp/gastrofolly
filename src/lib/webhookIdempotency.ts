import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"

/**
 * Bir webhook olayının daha önce işlenip işlenmediğini kontrol eder ve
 * işlenmediyse kaydı atomik olarak oluşturur (unique constraint = kilit).
 * Aynı olay ikinci kez gelirse (provider retry) false döner — çağıran taraf
 * hiçbir state değişikliği yapmadan başarı (200) dönmelidir.
 *
 * @returns true  -> bu olay ilk kez işleniyor, devam et
 * @returns false -> bu olay daha önce işlendi (duplicate), işlemi atla
 */
export async function claimWebhookEvent(source: string, dedupeKey: string): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({
      data: { source, dedupeKey: `${source}:${dedupeKey}` },
    })
    return true
  } catch (error: any) {
    // P2002 = unique constraint ihlali -> bu olay zaten işlendi
    if (error?.code === "P2002") {
      return false
    }
    throw error
  }
}

/** Sabit bir dedupe anahtarı yoksa, tüm payload'dan deterministik bir hash üretir. */
export function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex")
}
