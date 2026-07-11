import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const { usernames } = await request.json()

        if (!Array.isArray(usernames) || usernames.length === 0) {
            return NextResponse.json({ validUsernames: {} })
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
