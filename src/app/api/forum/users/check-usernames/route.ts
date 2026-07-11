import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
    try {
        // Rate Limiting
        const ip = getClientIp(request)
        const rateLimit = checkRateLimit(ip, RATE_LIMITS.GENERAL)

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Çok fazla istek, lütfen biraz bekleyin.' },
                { status: 429 }
            )
        }

        const { usernames } = await request.json()

        if (!Array.isArray(usernames) || usernames.length === 0) {
            return NextResponse.json({ validUsernames: {} })
        }

        // Batch size kontrolü
        if (usernames.length > 50) {
            return NextResponse.json(
                { error: 'Tek seferde en fazla 50 kullanıcı adı kontrol edilebilir.' },
                { status: 400 }
            )
        }

        const users = await prisma.user.findMany({
            where: {
                username: {
                    in: usernames
                }
            },
            select: {
                id: true,
                username: true
            }
        })

        const validUsernames: Record<string, string> = {}
        users.forEach(u => {
            if (u.username) {
                validUsernames[u.username] = u.id
            }
        })

        return NextResponse.json({ validUsernames })
    } catch (error) {
        console.error("Check usernames error:", error)
        return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 })
    }
}
