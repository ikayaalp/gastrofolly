import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StoriesClient from './StoriesClient'

export const metadata: Metadata = {
    title: 'Hikaye Yönetimi | Culinora Admin',
    description: 'Tüm hikayeleri yönetin',
}

export default async function StoriesAdminPage() {
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

    return <StoriesClient />
}
