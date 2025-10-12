import Iyzipay from 'iyzipay'

// Iyzico yapılandırması
export const iyzico = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-eq7YZQDpwxzkr9YHnq9xdYoR5OMXEQSuve',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-QXZ7ogP4KUdnG9OeLV8yIdBr3xwu6M27',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
})

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
export const createCheckoutForm = (paymentRequest: IyzicoPaymentRequest): Promise<IyzicoCheckoutFormResult> => {
  return new Promise((resolve, reject) => {
    iyzico.checkoutFormInitialize.create(paymentRequest, (err: Error | null, result: IyzicoCheckoutFormResult) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

/**
 * Iyzico ödeme sonucunu kontrol eder
 */
export const retrieveCheckoutForm = (token: string): Promise<IyzicoPaymentResult> => {
  return new Promise((resolve, reject) => {
    iyzico.checkoutForm.retrieve(
      {
        locale: 'tr',
        conversationId: Date.now().toString(),
        token: token
      },
      (err: Error | null, result: IyzicoPaymentResult) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      }
    )
  })
}

