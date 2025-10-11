/**
 * Şifre validasyon kuralları
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  // Minimum uzunluk kontrolü
  if (password.length < 8) {
    errors.push('En az 8 karakter olmalıdır')
  }

  // Büyük harf kontrolü
  if (!/[A-Z]/.test(password)) {
    errors.push('En az 1 büyük harf içermelidir')
  }

  // Küçük harf kontrolü
  if (!/[a-z]/.test(password)) {
    errors.push('En az 1 küçük harf içermelidir')
  }

  // Rakam kontrolü
  if (!/\d/.test(password)) {
    errors.push('En az 1 rakam içermelidir')
  }

  // Özel karakter kontrolü
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('En az 1 özel karakter içermelidir (!@#$%^&*)')
  }

  // Şifre gücünü hesapla
  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  const criteriaCount = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

  if (criteriaCount === 5 && password.length >= 12) {
    strength = 'strong'
  } else if (criteriaCount >= 4) {
    strength = 'medium'
  } else {
    strength = 'weak'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

/**
 * Şifre gücü rengi
 */
export function getStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * Şifre gücü metni
 */
export function getStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Zayıf'
    case 'medium':
      return 'Orta'
    case 'strong':
      return 'Güçlü'
    default:
      return ''
  }
}

