import { Metadata } from 'next'
import ChefAIClient from './ChefAIClient'

export const metadata: Metadata = {
    title: 'Culi - Kişisel Mutfak Asistanı',
    description: 'Yapay zeka destekli mutfak asistanınız Culi ile tarifler oluşturun, teknikler öğrenin.',
}

export default function ChefAIPage() {
    return <ChefAIClient />
}
