import { prisma } from '@/lib/prisma'

export async function generateUniqueUsername(name: string | null, email: string): Promise<string> {
    let baseSlug = ''
    if (name) {
        baseSlug = name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/ /g, '_')
            .replace(/[^a-z0-9_]/g, '')
    }
    
    if (!baseSlug) {
        baseSlug = email.split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
    }

    if (!baseSlug) {
        baseSlug = 'user'
    }

    let username = baseSlug
    let counter = 1
    
    while (true) {
        const existingUser = await prisma.user.findUnique({
            where: { username }
        })
        
        if (!existingUser) {
            break
        }
        
        counter++
        username = `${baseSlug}${counter}`
    }
    
    return username
}
