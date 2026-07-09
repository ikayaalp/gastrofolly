import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import CategoryManagement from "./CategoryManagement"

export default async function CategoriesPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
        redirect("/dashboard")
    }

    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { courses: true }
            }
        },
        orderBy: { name: 'asc' }
    })

    return (
        <CategoryManagement categories={categories} />
    )
}
