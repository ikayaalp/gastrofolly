import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import CategoryPageClient from "./CategoryPageClient"

interface CategoryPageProps {
    params: Promise<{
        categoryId: string
    }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { categoryId } = await params
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true, description: true },
    })

    if (!category) {
        return {
            title: "Kategori",
            description: "Culinora'daki mutfak kurslarını kategorilere göre keşfedin.",
        }
    }

    return {
        title: `${category.name} Eğitimleri`,
        description: category.description || `${category.name} kategorisindeki profesyonel şef eğitimlerini keşfedin.`,
        alternates: {
            canonical: `/category/${categoryId}`,
        },
    }
}

export default function CategoryPage() {
    return <CategoryPageClient />
}
