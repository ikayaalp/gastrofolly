import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SocialClient from './SocialClient'

export const metadata: Metadata = {
    title: 'Şef Sosyal Yönetimi | Culinora Admin',
    description: 'Forum konu ve tartışma yönetimi',
}

export default async function SocialAdminPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect('/auth/signin')
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    return <SocialClient />
}
