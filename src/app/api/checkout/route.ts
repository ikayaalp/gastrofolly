import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createCheckoutForm, IyzicoPaymentRequest } from "@/lib/iyzico"

interface CartItem {
  id: string
  title: string
  price: number
  discountedPrice?: number
  imageUrl?: string
  instructor: {
    name: string
  }
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Vercel'den gelen IP'yi kontrol et
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    return vercelIp.split(',')[0].trim()
  }
  
  // Türkiye IP'si kullan
  return '85.34.78.112'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { items, total } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart items are required" },
        { status: 400 }
      )
    }

    // Kullanıcının bu kurslara zaten kayıtlı olup olmadığını kontrol et
    const courseIds = items.map((item: CartItem) => item.id)
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        courseId: { in: courseIds }
      }
    })

    if (existingEnrollments.length > 0) {
      return NextResponse.json(
        { error: "Bu kurslardan bazılarına zaten kayıtlısınız" },
        { status: 400 }
      )
    }

    // Kullanıcı bilgilerini al
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      )
    }

    // KDV dahil toplam fiyat hesapla
    const totalWithTax = total * 1.18
    
    // Sepet öğelerini Iyzico formatına çevir
    const basketItems = items.map((item: CartItem) => {
      const itemPrice = item.discountedPrice || item.price
      const itemPriceWithTax = itemPrice * 1.18
      
      return {
        id: item.id,
        name: item.title.substring(0, 64), // Iyzico max 64 karakter
        category1: 'Eğitim',
        category2: 'Online Kurs',
        itemType: 'VIRTUAL',
        price: itemPriceWithTax.toFixed(2)
        // subMerchantKey ve subMerchantPrice - Pazaryeri değilse GÖNDERMEYİN
      }
    })

    // Benzersiz conversation ID
    const conversationId = `${session.user.id}_${Date.now()}`
    
    // Kullanıcı adını parçala
    const nameParts = (user.name || 'Kullanıcı').split(' ')
    const firstName = nameParts[0] || 'Kullanıcı'
    const lastName = nameParts.slice(1).join(' ') || 'Soyadı'
    
    // Kullanıcı IP adresini al
    const userIp = getClientIp(request)
    
    // Callback URL'i düzgün oluştur (conversationId ile)
    const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'https://culinora.net'
    const callbackUrl = `${baseUrl}/api/iyzico/callback?conversationId=${conversationId}`
    
    console.log('İstek detayları:', {
      userIp,
      conversationId,
      totalWithTax,
      itemsCount: items.length,
      callbackUrl
    })

    // Iyzico ödeme isteği hazırla
    const paymentRequest: IyzicoPaymentRequest = {
      locale: 'tr',
      conversationId: conversationId,
      price: totalWithTax.toFixed(2),
      paidPrice: totalWithTax.toFixed(2),
      currency: 'TRY',
      basketId: conversationId,
      paymentGroup: 'PRODUCT',
      callbackUrl: callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: session.user.id,
        name: firstName,
        surname: lastName,
        gsmNumber: '+905350000000', // Sandbox test numarası
        email: user.email,
        identityNumber: '11111111111', // Sandbox için sabit
        lastLoginDate: '2015-10-05 12:43:35',
        registrationDate: '2013-04-21 15:12:09',
        registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        ip: userIp,
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34732'
      },
      shippingAddress: {
        contactName: `${firstName} ${lastName}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        zipCode: '34732'
      },
      billingAddress: {
        contactName: `${firstName} ${lastName}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        zipCode: '34732'
      },
      basketItems: basketItems
    }

    // Iyzico ödeme formunu oluştur
    const result = await createCheckoutForm(paymentRequest)

    if (result.status === 'success' && result.checkoutFormContent) {
      // Her kurs için ödeme kaydı oluştur (callback'te kullanmak için)
      for (const courseId of courseIds) {
        const courseItem = items.find((item: CartItem) => item.id === courseId)
        const coursePrice = courseItem ? (courseItem.discountedPrice || courseItem.price) * 1.18 : 0
        
        await prisma.payment.create({
          data: {
            userId: session.user.id,
            courseId: courseId,
            amount: coursePrice,
            currency: 'TRY',
            status: 'PENDING',
            stripePaymentId: conversationId, // conversationId'yi sakla
          }
        })
      }

      return NextResponse.json({
        success: true,
        paymentPageUrl: result.paymentPageUrl,
        checkoutFormContent: result.checkoutFormContent,
        token: result.token,
        conversationId: conversationId,
        items: courseIds // Callback'te kullanmak için
      })
    } else {
      console.error('Iyzico error:', result)
      return NextResponse.json(
        { error: result.errorMessage || 'Ödeme formu oluşturulamadı' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

