/**
 * Doğrulanmayı bekleyen kullanıcılar için geçici storage
 * Production'da Redis veya database tablosu kullanılabilir
 */

interface PendingUser {
  name: string
  email: string
  password: string // Hashlenmiş
  verificationCode: string
  codeExpiry: Date
  createdAt: Date
}

// In-memory storage
const pendingUsers = new Map<string, PendingUser>()

/**
 * Geçici kullanıcı ekle
 */
export function addPendingUser(email: string, data: PendingUser): void {
  pendingUsers.set(email.toLowerCase(), data)
}

/**
 * Geçici kullanıcı getir
 */
export function getPendingUser(email: string): PendingUser | undefined {
  return pendingUsers.get(email.toLowerCase())
}

/**
 * Geçici kullanıcıyı sil
 */
export function deletePendingUser(email: string): void {
  pendingUsers.delete(email.toLowerCase())
}

/**
 * Kodu güncelle (yeni kod gönderildiğinde)
 */
export function updatePendingUserCode(email: string, code: string, expiry: Date): boolean {
  const pending = pendingUsers.get(email.toLowerCase())
  if (!pending) return false
  
  pending.verificationCode = code
  pending.codeExpiry = expiry
  pendingUsers.set(email.toLowerCase(), pending)
  return true
}

/**
 * Süresi dolmuş kayıtları temizle (cleanup - opsiyonel)
 */
export function cleanupExpiredPendingUsers(): void {
  const now = new Date()
  for (const [email, data] of pendingUsers.entries()) {
    if (data.codeExpiry < now) {
      pendingUsers.delete(email)
    }
  }
}

