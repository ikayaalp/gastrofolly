import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        console.log("API: Fetching categories request started");

        // Simple fetch first to test connection
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });

        console.log(`API: Successfully fetched ${categories.length} categories`);

        // Format manually for now, counting courses separately if needed or just skipping count to debug
        // For debugging, let's just return categories without course count first
        const formattedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            imageUrl: cat.imageUrl,
            courseCount: 0 // Temporary fix to isolate the issue
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
