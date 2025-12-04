import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import CertificateDisplay from "./CertificateDisplay"

interface CertificatePageProps {
    params: Promise<{ id: string }>
}

async function getCertificate(id: string, userId: string) {
    return await prisma.certificate.findFirst({
        where: {
            id,
            userId
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            course: {
                select: {
                    title: true,
                    instructor: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    })
}

export default async function CertificateDetailPage({ params }: CertificatePageProps) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
        notFound()
    }

    const certificate = await getCertificate(id, session.user.id)

    if (!certificate) {
        notFound()
    }

    return <CertificateDisplay certificate={certificate} />
}
