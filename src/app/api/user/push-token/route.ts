import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

// PUT - Push token kaydet
export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        const { pushToken } = await request.json()

        if (!pushToken) {
            return NextResponse.json({ error: 'Push token gerekli' }, { status: 400 })
        }

        // Token'ı kullanıcıya kaydet
        await prisma.user.update({
            where: { id: user.id },
            data: { pushToken }
        })

        return NextResponse.json({ success: true, message: 'Push token kaydedildi' })
    } catch (error) {
        console.error('Error saving push token:', error)
        return NextResponse.json({ error: 'Push token kaydedilemedi' }, { status: 500 })
    }
}

// DELETE - Push token sil (çıkış yaparken)
export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { pushToken: null }
        })

        return NextResponse.json({ success: true, message: 'Push token silindi' })
    } catch (error) {
        console.error('Error deleting push token:', error)
        return NextResponse.json({ error: 'Push token silinemedi' }, { status: 500 })
    }
}
