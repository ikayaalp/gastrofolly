import crypto from 'crypto'

// Iyzico yapılandırması
const IYZICO_CONFIG = {
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-eq7YZQDpwxzkr9YHnq9xdYoR5OMXEQSuve',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-QXZ7ogP4KUdnG9OeLV8yIdBr3xwu6M27',
  baseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
}

/**
 * İyzico için authorization header oluşturur
 */
function generateAuthHeader(endpoint: string, requestBody: string): string {
  const randomString = crypto.randomBytes(8).toString('hex')
  const dataToSign = randomString + endpoint + requestBody
  
  const hash = crypto
    .createHmac('sha256', IYZICO_CONFIG.secretKey)
    .update(dataToSign, 'utf8')
    .digest('base64')
  
  return `IYZWS ${IYZICO_CONFIG.apiKey}:${hash}:${randomString}`
}

/**
 * İyzico için gerekli header'ları oluşturur
 */
function getIyzicoHeaders(endpoint: string, requestBody: string) {
  const randomString = crypto.randomBytes(8).toString('hex')
  const authHeader = generateAuthHeader(endpoint, requestBody)
  
  return {
    'Content-Type': 'application/json',
    'Authorization': authHeader,
    'x-iyzi-rnd': randomString,
    'x-iyzi-client-version': 'iyzipay-node-2.0.48'
  }
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
    'Authorization': headers['Authorization'].substring(0, 50) + '...',
    'x-iyzi-rnd': headers['x-iyzi-rnd'],
    'x-iyzi-client-version': headers['x-iyzi-client-version']
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

