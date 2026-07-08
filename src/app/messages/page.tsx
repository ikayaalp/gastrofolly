import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MessagesInboxClient from './MessagesInboxClient'

export const metadata: Metadata = {
    title: 'Mesajlar | Culinora',
    description: 'Direkt mesajlarınız'
}

export default async function MessagesPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        redirect('/auth/signin')
    }
    return <MessagesInboxClient userId={session.user.id} />
}
