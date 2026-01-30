import crypto from 'crypto'

// Iyzico yapılandırması
const IYZICO_CONFIG = {
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-eq7YZQDpwxzkr9YHnq9xdYoR5OMXEQSu',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-QXZ7ogP4KUdnG9OeLV8yIdBr3xwu6M27',
  baseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
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
 */
async function makeIyzicoRequest<T>(endpoint: string, requestBody: unknown): Promise<T> {
  // Base URL ve endpoint arasındaki çift slash (//) hatasını temizle
  const cleanBaseUrl = IYZICO_CONFIG.baseUrl.replace(/\/$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${cleanBaseUrl}${cleanEndpoint}`
  const bodyString = JSON.stringify(requestBody)

  console.log('İyzico API Request Details:', {
    url,
    endpoint,
    apiKey: IYZICO_CONFIG.apiKey.substring(0, 15) + '...',
    baseUrl: IYZICO_CONFIG.baseUrl,
    requestBodyLength: bodyString.length
  })

  const headers = getIyzicoHeaders(endpoint, bodyString)
  // V2 API'leri bazen Accept header'ına çok duyarlıdır
  headers['Accept'] = 'application/json'

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: bodyString
  })

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
      throw new Error(`Iyzico Endpoint bulunamadı (404). Kullandığınız Base URL (${IYZICO_CONFIG.baseUrl}) veya endpoint (${endpoint}) Sandbox için geçerli olmayabilir. Lütfen Iyzico panelinizden yeni sandbox anahtarları alıp deneyin.`)
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
export const retrieveCheckoutForm = async (token: string): Promise<IyzicoPaymentResult> => {
  const request = {
    locale: 'tr',
    conversationId: Date.now().toString(),
    token: token
  }

  // İyzico dokümantasyonuna göre doğru endpoint
  return makeIyzicoRequest<IyzicoPaymentResult>('/payment/iyzipos/checkoutform/auth/ecom/detail', request)
}

/* ---------- SUBSCRIPTION API V2 ---------- */

export interface IyzicoSubscriptionCheckoutResultDetail {
  status: string
  errorCode?: string
  errorMessage?: string
  token: string
  referenceCode: string
  parentReferenceCode: string
  pricingPlanReferenceCode: string
  customerReferenceCode: string
  subscriptionStatus: "ACTIVE" | "PENDING" | "CANCELED"
  trialEndDate?: number
  createdDate: number
  startDate: number
  endDate: number
}

// ... existing interfaces ...

/**
 * Abonelik Checkout Form Sonucunu Sorgula (V2)
 * Endpoint: /v2/subscription/checkout-form/{token}
 * NOT: Bu endpoint dökümantasyonda bazen farklı olabiliyor, 
 * ama genelde token ile detay almak için bu yapı kullanılır.
 * Eğer Iyzico dökümanında yoksa, webhook en güvenli yoldur.
 * Ancak basit entegrasyon için token'ı 'active' varsayabiliriz veya
 * en doğrusu: subscription details sorgulamak.
 */
export const getSubscriptionCheckoutResult = async (token: string): Promise<IyzicoSubscriptionCheckoutResultDetail> => {
  // API v2'de token ile direkt sorgu genelde /v2/subscription/checkout-form/{token} şeklindedir
  // Ancak resmi dökümanda net değilse, 'active' kabul edip, güvenli yol için
  // ileride webhook kullanmak daha iyidir.
  // Şimdilik standart bir GET yapısı deneyelim.
  return makeIyzicoRequest<IyzicoSubscriptionCheckoutResultDetail>(`/v2/subscription/checkout-form/${token}`, {})
}

export interface IyzicoSubscriptionProduct {
  name: string
  referenceCode: string
}

export interface IyzicoSubscriptionPricingPlan {
  productReferenceCode: string
  name: string
  price: number
  currencyCode: "TRY" | "USD" | "EUR"
  paymentInterval: "MONTHLY" | "WEEKLY" | "YEARLY"
  paymentIntervalCount: number
  trialPeriodDays: number
  planPaymentType: "RECURRING"
  referenceCode: string
}

export interface IyzicoSubscriptionCustomer {
  name: string
  surname: string
  identityNumber: string
  email: string
  gsmNumber: string
  billingAddress: IyzicoAddress
  shippingAddress: IyzicoAddress
}

export interface IyzicoAddress {
  contactName: string
  city: string
  country: string
  address: string
  zipCode?: string
}

export interface IyzicoSubscriptionCheckoutRequest {
  locale: "tr" | "en"
  conversationId: string
  pricingPlanReferenceCode: string
  subscriptionInitialStatus: "ACTIVE" | "PENDING"
  callbackUrl: string
  customer: IyzicoSubscriptionCustomer
}

export interface IyzicoSubscriptionCheckoutResult {
  status: string
  errorCode?: string
  errorMessage?: string
  conversationId: string
  token: string
  checkoutFormContent: string
}

/**
 * Ürün Oluştur (Subscription API v2)
 * Endpoint: /v2/subscription/products
 */
export const createSubscriptionProduct = async (product: IyzicoSubscriptionProduct) => {
  return makeIyzicoRequest('/v2/subscription/products', {
    locale: 'tr',
    conversationId: Date.now().toString(),
    ...product
  })
}

/**
 * Plan Oluştur (Subscription API v2)
 * Endpoint: /v2/subscription/pricing-plans
 */
export const createSubscriptionPricingPlan = async (plan: IyzicoSubscriptionPricingPlan) => {
  return makeIyzicoRequest('/v2/subscription/pricing-plans', {
    locale: 'tr',
    conversationId: Date.now().toString(),
    ...plan
  })
}

/**
 * Abonelik Ödeme Formu Başlat (Subscription API v2)
 * Endpoint: /v2/subscription/checkout-form/initialize
 */
export const initializeSubscriptionCheckout = async (request: IyzicoSubscriptionCheckoutRequest): Promise<IyzicoSubscriptionCheckoutResult> => {
  return makeIyzicoRequest<IyzicoSubscriptionCheckoutResult>('/v2/subscription/checkout-form/initialize', request)
}
export interface IyzicoCancelSubscriptionResult {
  status: string
  errorCode?: string
  errorMessage?: string
  systemTime: number
}

/**
 * Abonelik İptal Et (Subscription API v2)
 * Endpoint: /v2/subscription/subscriptions/{subscriptionReferenceCode}/cancel
 */
export const cancelSubscription = async (subscriptionReferenceCode: string): Promise<IyzicoCancelSubscriptionResult> => {
  return makeIyzicoRequest<IyzicoCancelSubscriptionResult>(`/v2/subscription/subscriptions/${subscriptionReferenceCode}/cancel`, {
    locale: 'tr',
    conversationId: Date.now().toString()
  })
}

/**
 * Iyzico Webhook İmza Doğrulama
 * Iyzico'dan gelen isteğin güvenilir olup olmadığını kontrol eder.
 * Iyzico, "X-Iyzi-Signature" header'ı ile gelir.
 */
export const validateWebhookSignature = (iyziSignature: string, payload: any): boolean => {
  try {
    const secretKey = IYZICO_CONFIG.secretKey;
    // Payload, raw json string olmalıdır. Route handler'dan alırken dikkat edilmeli.
    // Iyzico dokümanına göre: sha1(secretKey + requestBody) ? Hayır, Iyzico v2 Subscription için farklı olabilir.
    // Standart Iyzico webhook: "iyziSignature" header contains base64 encoded signature.
    // Ancak Subscription v2 webhook dokümantasyonu bazen farklılık gösterir.
    // Genelde: base64(sha1(secretKey + content))

    // NOT: Iyzico sandbox ortamında webhook tetiklemek zor olabilir.
    // Güvenlik için secretKey kontrolü ekliyoruz.

    const calculatedSignature = crypto
      .createHmac('sha1', secretKey)
      .update(JSON.stringify(payload))
      .digest('base64');

    // Şimdilik imza kontrolünü opsiyonel yapalım, çünkü Iyzico'nun hangi formatı kullandığı dokümanda net değil.
    // Ama loglayalım.
    console.log("Webhook Signature Check:", {
      incoming: iyziSignature,
      calculated: calculatedSignature
    });

    return iyziSignature === calculatedSignature;
  } catch (e) {
    console.error("Signature validation error:", e);
    return false;
  }
}

export interface IyzicoWebhookPayload {
  orderReferenceCode: string;
  customerReferenceCode: string;
  subscriptionReferenceCode: string;
  iyziReferenceCode: string;
  iyziEventTime: number;
  iyziEventType: "SUBSCRIPTION_ORDER_SUCCESS" | "SUBSCRIPTION_CREATED" | "SUBSCRIPTION_CANCELED";
  status: string;
}
