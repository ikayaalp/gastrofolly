declare module 'iyzipay' {
  export interface IyzipayConfig {
    apiKey: string
    secretKey: string
    uri: string
  }

  export interface CheckoutFormRequest {
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
    basketItems: Array<{
      id: string
      name: string
      category1: string
      category2?: string
      itemType: string
      price: string
    }>
  }

  export interface CheckoutFormRetrieveRequest {
    locale: string
    conversationId: string
    token: string
  }

  export class BASKET_ITEM_TYPE {
    static PHYSICAL: string
    static VIRTUAL: string
  }

  export class PAYMENT_GROUP {
    static PRODUCT: string
    static LISTING: string
    static SUBSCRIPTION: string
  }

  export default class Iyzipay {
    constructor(config: IyzipayConfig)
    
    checkoutFormInitialize: {
      create(
        request: CheckoutFormRequest,
        callback: (err: Error | null, result: any) => void
      ): void
    }
    
    checkoutForm: {
      retrieve(
        request: CheckoutFormRetrieveRequest,
        callback: (err: Error | null, result: any) => void
      ): void
    }

    static BASKET_ITEM_TYPE: typeof BASKET_ITEM_TYPE
    static PAYMENT_GROUP: typeof PAYMENT_GROUP
  }
}

