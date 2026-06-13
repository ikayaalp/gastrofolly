import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(plans)
    } catch (error) {
        console.error("[SUBSCRIPTION_PLANS_GET]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { name, price, interval, iyzicoPlanCode, isActive } = body

        if (!name || typeof price !== 'number') {
            return new NextResponse("Name and Price are required", { status: 400 })
        }

        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                price,
                interval: interval || "monthly",
                iyzicoPlanCode,
                isActive: isActive ?? true
            }
        })

        return NextResponse.json(plan)
    } catch (error) {
        console.error("[SUBSCRIPTION_PLANS_POST]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}
