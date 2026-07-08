import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ChatClient from './ChatClient'

export const metadata: Metadata = {
    title: 'Sohbet | Culinora',
    description: 'Direkt mesaj sohbeti'
}

export default async function ChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        redirect('/auth/signin')
    }
    const { conversationId } = await params
    return <ChatClient conversationId={conversationId} currentUserId={session.user.id} />
}
