import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const categories = await prisma.category.findMany();
        const courses = await prisma.course.findMany({
            include: { category: true },
            take: 20
        });

        return NextResponse.json({
            categoryCount: categories.length,
            courseCount: courses.length,
            categories: categories.map(c => ({ id: c.id, name: c.name })),
            courses: courses.map(c => ({
                id: c.id,
                title: c.title,
                isPublished: c.isPublished,
                categoryId: c.categoryId,
                categoryName: c.category?.name || "NONE"
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
