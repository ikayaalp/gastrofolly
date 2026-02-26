import crypto from 'crypto'

// Iyzico yapılandırması (Production)
const IYZICO_CONFIG = {
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  baseUrl: process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com'
}

if (!IYZICO_CONFIG.apiKey || !IYZICO_CONFIG.secretKey) {
  console.error('UYARI: IYZICO_API_KEY ve IYZICO_SECRET_KEY environment variable\'ları tanımlanmalıdır!')
}

/**
 * İyzico için authorization header oluşturur (IYZWSv2 formatı)
 * İyzico dokümantasyonuna göre: https://docs.iyzico.com
 */
function generateAuthHeader(endpoint: string, requestBody: string): { authHeader: string; randomString: string } {
  // 1. Random key oluştur (8 byte = 16 hex karakter)
  const randomKey = crypto.randomBytes(8).toString('hex')

  // 2. HMAC-SHA256 için data: randomKey + endpoint + requestBody
  const dataToSign = randomKey + endpoint + requestBody

  console.log('IYZWSv2 İmza Oluşturma:', {
    format: 'randomKey + endpoint + requestBody',
    randomKey,
    endpoint,
    requestBodyLength: requestBody.length,
    dataToSignLength: dataToSign.length
  })

  // 3. HMAC-SHA256 ile encryptedData oluştur (HEX digest)
  const encryptedData = crypto
    .createHmac('sha256', IYZICO_CONFIG.secretKey)
    .update(dataToSign, 'utf8')
    .digest('hex')

  // 4. Authorization string oluştur
  const authorizationString = `apiKey:${IYZICO_CONFIG.apiKey}&randomKey:${randomKey}&signature:${encryptedData}`

  // 5. Base64 encode et
  const base64EncodedAuthorization = Buffer.from(authorizationString, 'utf8').toString('base64')

  // 6. Final header: IYZWSv2 + base64
  const authHeader = `IYZWSv2 ${base64EncodedAuthorization}`

  console.log('IYZWSv2 Auth Header Oluşturuldu:', {
    randomKey,
    encryptedData: encryptedData.substring(0, 20) + '...',
    authorizationString: authorizationString.substring(0, 60) + '...',
    base64Length: base64EncodedAuthorization.length,
    headerFormat: 'IYZWSv2 [base64]'
  })

  return { authHeader, randomString: randomKey }
}

/**
 * İyzico için gerekli header'ları oluşturur
 * İyzico'nun beklediği header formatı
 */
function getIyzicoHeaders(endpoint: string, requestBody: string) {
  const { authHeader, randomString } = generateAuthHeader(endpoint, requestBody)

  const headers: Record<string, string> = {
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
 * @param endpoint API endpoint
 * @param requestBody İstek gövdesi (GET isteklerinde null olabilir)
 * @param method HTTP metodu (varsayılan: POST)
 */
async function makeIyzicoRequest<T>(endpoint: string, requestBody: unknown, method: 'GET' | 'POST' = 'POST'): Promise<T> {
  // Base URL ve endpoint arasındaki çift slash (//) hatasını temizle
  const cleanBaseUrl = IYZICO_CONFIG.baseUrl.replace(/\/$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${cleanBaseUrl}${cleanEndpoint}`
  // GET isteklerinde body boş string olarak gönderilir (auth header hesaplaması için)
  const bodyString = method === 'GET' ? '' : JSON.stringify(requestBody)

  console.log('İyzico API Request Details:', {
    url,
    endpoint,
    method,
    apiKey: IYZICO_CONFIG.apiKey.substring(0, 15) + '...',
    baseUrl: IYZICO_CONFIG.baseUrl,
    requestBodyLength: bodyString.length
  })

  // Auth header'ı endpoint ve body string ile oluştur
  const headers = getIyzicoHeaders(cleanEndpoint, bodyString)
  // V2 API'leri bazen Accept header'ına çok duyarlıdır
  headers['Accept'] = 'application/json'

  const fetchOptions: RequestInit = {
    method,
    headers,
  }

  // GET isteklerinde body gönderilmez
  if (method === 'POST') {
    fetchOptions.body = bodyString
  }

  const response = await fetch(url, fetchOptions)

  const text = await response.text()
  const contentType = response.headers.get("content-type")

  if (!contentType || !contentType.includes("application/json")) {
    console.error("Iyzico API non-JSON response:", {
      status: response.status,
      url,
      contentType,
      body: text.substring(0, 500)
    })

    // 404 hatası geliyorsa, endpoint yanlış olabilir
    if (text.includes("404") || response.status === 404) {
      throw new Error(`Iyzico Endpoint bulunamadı (404). Base URL: ${IYZICO_CONFIG.baseUrl}, Endpoint: ${endpoint}. Lütfen API anahtarlarınızı ve endpoint'i kontrol edin.`)
    }

    throw new Error(`Iyzico API HTML cevabı döndürdü (Kod: ${response.status}).`)
  }

  try {
    const result = JSON.parse(text) as T
    console.log('İyzico API Response:', result)
    return result
  } catch (e) {
    console.error("Iyzico API JSON parse error:", {
      status: response.status,
      text: text.substring(0, 500)
    })
    throw new Error(`Iyzico API cevabı parse edilemedi: ${text.substring(0, 100)}`)
  }
}

/* ---------- (Aşağıdaki export ve tip tanımları senin orijinal dosyandan alındı) ---------- */

export interface IyzicoPaymentItem {
  id: string
  name: string
  category1: string
  category2?: string
  itemType: string
  price: string
  subMerchantKey?: string
  subMerchantPrice?: string
}

export interface IyzicoPaymentRequest {
  locale: string
  conversationId: string
  price: string
  paidPrice: string
  currency: string
  basketId: string
  paymentGroup: string
  paymentChannel?: string
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
    lastLoginDate?: string
    registrationDate?: string
    zipCode?: string
    ip: string
    city: string
    country: string
  }
  shippingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode?: string
  }
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode?: string
  }
  basketItems: IyzicoPaymentItem[]
}

export interface IyzicoSubscriptionCustomer {
  name: string
  surname: string
  identityNumber: string
  email: string
  gsmNumber?: string
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode?: string
  }
  shippingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode?: string
  }
}

export interface IyzicoSubscriptionCheckoutRequest {
  locale: string
  conversationId: string
  callbackUrl: string
  pricingPlanReferenceCode: string
  subscriptionInitialStatus: "ACTIVE" | "PENDING"
  customer: IyzicoSubscriptionCustomer
}

export interface IyzicoSubscriptionCheckoutResult {
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

export interface IyzicoSubscriptionRetrieveRequest {
  checkoutFormToken: string
}

export interface IyzicoSubscriptionResult {
  status: string
  locale: string
  systemTime: number
  conversationId?: string
  referenceCode?: string
  parentReferenceCode?: string
  pricingPlanReferenceCode?: string
  customerReferenceCode?: string
  subscriptionStatus?: string
  trialDays?: number
  trialStartDate?: number
  trialEndDate?: number
  createdDate?: number
  startDate?: number
  errorCode?: string
  errorMessage?: string
  errorGroup?: string
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
  basketId?: string
  mdStatus?: number
  errorCode?: string
  errorMessage?: string
  errorGroup?: string
}

/**
 * Iyzico ödeme formu oluşturur
 * İyzico dokümantasyonuna göre: https://docs.iyzico.com
 * Doğru endpoint: /payment/iyzipos/checkoutform/initialize/auth/ecom
 */
export const createCheckoutForm = async (paymentRequest: IyzicoPaymentRequest): Promise<IyzicoCheckoutFormResult> => {
  // İyzico CheckoutForm API - auth/ecom endpoint'i kullanmalıyız
  return makeIyzicoRequest<IyzicoCheckoutFormResult>('/payment/iyzipos/checkoutform/initialize/auth/ecom', paymentRequest)
}

/**
 * Iyzico ödeme sonucunu kontrol eder
 * Doğru endpoint: /payment/iyzipos/checkoutform/auth/ecom/detail
 */
/**
 * Iyzico ödeme sonucu sorgulama (Checkout Form Token ile)
 */
export const retrieveCheckoutForm = async (token: string): Promise<IyzicoPaymentResult> => {
  const request = {
    locale: 'tr',
    conversationId: Date.now().toString(),
    token: token
  }
  return makeIyzicoRequest<IyzicoPaymentResult>('/payment/iyzipos/checkoutform/auth/ecom/detail', request)
}

/**
 * Ödeme Detayı Sorgulama (Payment ID veya Conversation ID ile)
 * Token kayıp ise veya 5122 hatası alınıyorsa bu kullanılabilir.
 */
export const retrievePaymentDetails = async (paymentId: string | null, conversationId: string | null): Promise<IyzicoPaymentResult> => {
  const request: any = {
    locale: 'tr',
    conversationId: Date.now().toString(),
  }
  if (paymentId) request.paymentId = paymentId
  if (conversationId) request.paymentConversationId = conversationId

  return makeIyzicoRequest<IyzicoPaymentResult>('/payment/detail', request)
}

/**
 * Iyzico Abonelik Ödeme Formu Oluşturur
 * İyzico dokümantasyonuna göre: Endpoint: /v2/subscription/checkoutform/initialize
 */
export const createSubscriptionCheckoutForm = async (request: IyzicoSubscriptionCheckoutRequest): Promise<IyzicoSubscriptionCheckoutResult> => {
  return makeIyzicoRequest<IyzicoSubscriptionCheckoutResult>('/v2/subscription/checkoutform/initialize', request)
}

/**
 * Iyzico Abonelik Ödeme Sonucunu Sorgular
 * Endpoint: /v2/subscription/checkoutform/[token] (GET metodu ile çalışır, body boştur)
 */
export const retrieveSubscriptionCheckoutForm = async (token: string): Promise<IyzicoSubscriptionResult> => {
  return makeIyzicoRequest<IyzicoSubscriptionResult>(`/v2/subscription/checkoutform/${token}`, null, 'GET')
}



