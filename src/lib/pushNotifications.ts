import { prisma } from './prisma'

interface PushMessage {
    to: string
    sound: 'default' | null
    title: string
    body: string
    data?: Record<string, unknown>
    badge?: number
}

interface ExpoPushTicket {
    status: 'ok' | 'error'
    id?: string
    message?: string
    details?: {
        error?: string
    }
}

/**
 * Tek bir kullanıcıya push notification gönder
 */
export async function sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<ExpoPushTicket | null> {
    const message: PushMessage = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
    }

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        })

        const ticket = await response.json() as ExpoPushTicket

        if (ticket.status === 'error') {
            console.error('Push notification error:', ticket.message, ticket.details)
        }

        return ticket
    } catch (error) {
        console.error('Error sending push notification:', error)
        return null
    }
}

/**
 * Birden fazla kullanıcıya push notification gönder
 * Token'ları tek tek gönderir - farklı project ID'leri desteklemek için
 */
export async function sendPushNotifications(
    pushTokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<ExpoPushTicket[]> {
    const allTickets: ExpoPushTicket[] = []
    const staleTokens: string[] = []

    // Her token için ayrı istek gönder (farklı project ID'leri desteklemek için)
    for (const token of pushTokens) {
        const message: PushMessage = {
            to: token,
            sound: 'default',
            title,
            body,
            data: data || {},
        }

        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            })

            const result = await response.json()

            // Expo API tek mesaj için { data: ticket } döndürür
            let ticket: ExpoPushTicket
            if (result.data) {
                ticket = result.data as ExpoPushTicket
            } else if (result.status) {
                // Doğrudan ticket döndüyse
                ticket = result as ExpoPushTicket
            } else if (result.errors) {
                console.error('Push error for token:', token, result.errors)
                ticket = { status: 'error', message: result.errors[0]?.message || 'Unknown error' }
            } else {
                ticket = { status: 'error', message: 'Unknown response' }
            }

            allTickets.push(ticket)

            // Expo, kalici olarak gecersiz/kaldirilmis cihazlar icin
            // DeviceNotRegistered doner. Bu token'i sonsuza kadar yeniden
            // denemek yerine, DB'den temizleyelim ki gelecekteki
            // gonderimler bosa gitmesin.
            if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
                staleTokens.push(token)
            }
        } catch (error) {
            console.error('Error sending push notification to token:', token, error)
            allTickets.push({ status: 'error', message: 'Network error' })
        }
    }

    if (staleTokens.length > 0) {
        console.log(`Clearing ${staleTokens.length} stale (DeviceNotRegistered) push token(s)`)
        await prisma.user.updateMany({
            where: { pushToken: { in: staleTokens } },
            data: { pushToken: null }
        })
    }

    return allTickets
}

/**
 * Tüm kullanıcılara push notification gönder (yeni kurs bildirimi için)
 */
export async function sendPushToAllUsers(
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<{ success: number; failed: number; errors?: string[] }> {
    // Push token'ı olan tüm kullanıcıları getir
    const usersWithTokens = await prisma.user.findMany({
        where: {
            pushToken: {
                not: null
            }
        },
        select: {
            pushToken: true
        }
    })

    const pushTokens = Array.from(new Set(
        usersWithTokens
            .map(u => u.pushToken)
            .filter((token): token is string => token !== null)
    ))

    if (pushTokens.length === 0) {
        console.log('No users with push tokens found')
        return { success: 0, failed: 0 }
    }

    console.log(`Found ${pushTokens.length} tokens. Sending push notifications...`)


    const tickets = await sendPushNotifications(pushTokens, title, body, data)
    console.log('Expo returned tickets:', JSON.stringify(tickets, null, 2))

    const success = tickets.filter(t => t.status === 'ok').length
    const failed = tickets.filter(t => t.status === 'error').length

    // Hataları topla
    const errors = tickets
        .filter(t => t.status === 'error')
        .map(t => t.message || t.details?.error || 'Unknown error')
        // Benzersiz hataları al
        .filter((value, index, self) => self.indexOf(value) === index)

    console.log(`Push notification results: ${success} success, ${failed} failed`)
    if (errors.length > 0) {
        console.log('Push errors:', errors)
    }

    return { success, failed, errors }
}

export async function sendPushToUserIds(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<{ success: number; failed: number; errors?: string[] }> {
    if (userIds.length === 0) return { success: 0, failed: 0 }

    const usersWithTokens = await prisma.user.findMany({
        where: {
            id: { in: userIds },
            pushToken: { not: null }
        },
        select: {
            pushToken: true
        }
    })

    const pushTokens = Array.from(new Set(
        usersWithTokens
            .map(u => u.pushToken)
            .filter((token): token is string => token !== null)
    ))

    if (pushTokens.length === 0) {
        console.log('No users with push tokens found in the target list')
        return { success: 0, failed: 0 }
    }

    console.log(`Found ${pushTokens.length} tokens for targeted users. Sending push notifications...`)

    const tickets = await sendPushNotifications(pushTokens, title, body, data)
    console.log('Expo returned tickets:', JSON.stringify(tickets, null, 2))

    const success = tickets.filter(t => t.status === 'ok').length
    const failed = tickets.filter(t => t.status === 'error').length

    const errors = tickets
        .filter(t => t.status === 'error')
        .map(t => t.message || t.details?.error || 'Unknown error')
        .filter((value, index, self) => self.indexOf(value) === index)

    console.log(`Targeted push results: ${success} success, ${failed} failed`)
    if (errors.length > 0) {
        console.log('Push errors:', errors)
    }

    return { success, failed, errors }
}
