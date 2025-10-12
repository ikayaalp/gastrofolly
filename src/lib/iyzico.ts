import crypto from 'crypto'

// Iyzico yapılandırması
const IYZICO_CONFIG = {
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-eq7YZQDpwxzkr9YHnq9xdYoR5OMXEQSu',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-QXZ7ogP4KUdnG9OeLV8yIdBr3xwu6M27',
  baseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
}

/**
 * İyzico için authorization header oluşturur
 * İyzico'nun beklediği tam format: randomString + endpoint + requestBody
 */
function generateAuthHeader(endpoint: string, requestBody: string): { authHeader: string; randomString: string } {
  // 8 byte random string (16 hex karakter)
  const randomString = crypto.randomBytes(8).toString('hex')

  // İyzico'nun beklediği format: randomString + endpoint + requestBody
  // Alternatif format da deneyelim: endpoint + randomString + requestBody
  const dataToSign = randomString + endpoint + requestBody
  
  console.log('İmza için kullanılan format:', {
    format: 'randomString + endpoint + requestBody',
    randomString,
    endpoint,
    requestBodyStart: requestBody.substring(0, 50) + '...'
  })

  console.log('İmza için kullanılan data:', {
    randomString,
    endpoint,
    requestBodyLength: requestBody.length,
    dataToSignLength: dataToSign.length,
    dataToSignPreview: dataToSign.substring(0, 100) + '...'
  })

  // HMAC-SHA256 ile imza oluştur
  const hash = crypto
    .createHmac('sha256', IYZICO_CONFIG.secretKey)
    .update(dataToSign, 'utf8')
    .digest('base64')

  // İyzico'nun beklediği header formatı - IYZWSv2 kullanılmalı!
  const authHeader = `IYZWSv2 ${IYZICO_CONFIG.apiKey}:${hash}:${randomString}`

  console.log('Oluşturulan auth header:', {
    format: 'IYZWSv2 apiKey:hash:randomString',
    apiKey: IYZICO_CONFIG.apiKey.substring(0, 15) + '...',
    hash: hash.substring(0, 20) + '...',
    randomString,
    fullHeader: authHeader.substring(0, 60) + '...',
    secretKeyUsed: IYZICO_CONFIG.secretKey.substring(0, 15) + '...'
  })

  return { authHeader, randomString }
}

/**
 * İyzico için gerekli header'ları oluşturur
 * İyzico'nun beklediği header formatı
 */
function getIyzicoHeaders(endpoint: string, requestBody: string) {
  const { authHeader, randomString } = generateAuthHeader(endpoint, requestBody)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authHeader,
    'x-iyzi-rnd': randomString
  }

  console.log('Final Headers:', {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers['Authorization'].substring(0, 80) + '...',
    'x-iyzi-rnd': headers['x-iyzi-rnd']
  })

  return headers
}

/**
 * İyzico API'ye istek gönderir
 */
async function makeIyzicoRequest<T>(endpoint: string, requestBody: unknown): Promise<T> {
  const url = `${IYZICO_CONFIG.baseUrl}${endpoint}`
  const bodyString = JSON.stringify(requestBody)

  console.log('İyzico API Request Details:', {
    url,
    endpoint,
    apiKey: IYZICO_CONFIG.apiKey.substring(0, 15) + '...',
    secretKey: IYZICO_CONFIG.secretKey.substring(0, 15) + '...',
    baseUrl: IYZICO_CONFIG.baseUrl,
    requestBody: bodyString.substring(0, 200) + '...'
  })

  const headers = getIyzicoHeaders(endpoint, bodyString)

  console.log('İyzico Headers:', {
    'Content-Type': headers['Content-Type'],
    'Authorization': (headers['Authorization'] as string).substring(0, 50) + '...',
    'x-iyzi-rnd': headers['x-iyzi-rnd']
  })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: bodyString
  })

  const result = await response.json() as T

  console.log('İyzico API Response:', result)

  return result
}

/* ---------- (Aşağıdaki export ve tip tanımları senin orijinal dosyandan alındı) ---------- */

export interface IyzicoPaymentItem {
  id: string
  name: string
  category1: string
  category2?: string
  itemType: string
  price: string
}

export interface IyzicoPaymentRequest {
  locale: string
  conversationId: string
  price: string
  paidPrice: string
  currency: string
  basketId: string
  paymentGroup: string
  callbackUrl: string
  enabledInstallments: number[]
  buyer: {
    id: string
    name: string
    surname: string
    gsmNumber?: string
    email: string
    identityNumber: string
    registrationAddress: string
    ip: string
    city: string
    country: string
  }
  shippingAddress: {
    contactName: string
    city: string
    country: string
    address: string
  }
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
  }
  basketItems: IyzicoPaymentItem[]
}

export interface IyzicoCallbackData {
  status: string
  locale: string
  systemTime: number
  conversationId: string
  token?: string
  paymentId?: string
  errorCode?: string
  errorMessage?: string
  errorGroup?: string
}

export interface IyzicoCheckoutFormResult {
  status: string
  locale: string
  systemTime: number
  conversationId: string
  token?: string
  tokenExpireTime?: number
  paymentPageUrl?: string
  checkoutFormContent?: string
  errorCode?: string
  errorMessage?: string
  errorGroup?: string
}

export interface IyzicoPaymentResult {
  status: string
  locale: string
  systemTime: number
  conversationId: string
  paymentId?: string
  paymentStatus?: string
  fraudStatus?: number
  price?: number
  paidPrice?: number
  currency?: string
  errorCode?: string
  errorMessage?: string
  errorGroup?: string
}

/**
 * Iyzico ödeme formu oluşturur
 */
export const createCheckoutForm = async (paymentRequest: IyzicoPaymentRequest): Promise<IyzicoCheckoutFormResult> => {
  return makeIyzicoRequest<IyzicoCheckoutFormResult>('/payment/iyzipos/checkoutform/initialize/auth/ecom', paymentRequest)
}

/**
 * Iyzico ödeme sonucunu kontrol eder
 */
export const retrieveCheckoutForm = async (token: string): Promise<IyzicoPaymentResult> => {
  const request = {
    locale: 'tr',
    conversationId: Date.now().toString(),
    token: token
  }

  return makeIyzicoRequest<IyzicoPaymentResult>('/payment/iyzipos/checkoutform/auth/ecom/detail', request)
}
