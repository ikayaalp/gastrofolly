import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendCustomEmail } from "@/lib/emailService"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
        }

        const { recipients, subject, message } = await request.json()

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ error: 'En az bir alıcı seçmelisiniz' }, { status: 400 })
        }

        if (!subject || !message) {
            return NextResponse.json({ error: 'Konu ve mesaj zorunludur' }, { status: 400 })
        }

        // Mesajı HTML formatına çevir (satır sonlarını <p> tag'lerine)
        const messageHtml = message
            .split('\n')
            .filter((line: string) => line.trim() !== '')
            .map((line: string) => `<p>${line}</p>`)
            .join('')

        const results: { email: string; success: boolean; error?: string }[] = []

        // Her alıcıya tek tek gönder
        for (const recipient of recipients) {
            try {
                const success = await sendCustomEmail(
                    recipient.email,
                    subject,
                    messageHtml,
                    recipient.name || undefined
                )
                results.push({ email: recipient.email, success })
            } catch (error: any) {
                results.push({ email: recipient.email, success: false, error: error.message })
            }
        }

        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        return NextResponse.json({
            message: `${successCount} mail başarıyla gönderildi${failCount > 0 ? `, ${failCount} başarısız` : ''}`,
            successCount,
            failCount,
            results
        })
    } catch (error: any) {
        console.error('Send mail error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
