import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        console.log("API: Fetching categories request started");

        // Simple fetch first to test connection
        const categories = await (prisma as any).category.findMany({
            include: {
                _count: {
                    select: { courses: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        console.log(`API: Successfully fetched ${categories.length} categories`);

        const formattedCategories = categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            imageUrl: cat.imageUrl,
            courseCount: cat._count?.courses || 0
        }));

        return NextResponse.json({ categories: formattedCategories });
    } catch (error: any) {
        console.error("API Error detailed:", error);
        return NextResponse.json({
            error: "Failed to fetch categories",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
