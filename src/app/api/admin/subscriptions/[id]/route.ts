import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { name, price, interval, iyzicoPlanCode, isActive } = body

        const plan = await prisma.subscriptionPlan.update({
            where: {
                id: params.id
            },
            data: {
                name,
                price,
                interval,
                iyzicoPlanCode,
                isActive
            }
        })

        return NextResponse.json(plan)
    } catch (error) {
        console.error("[SUBSCRIPTION_PLAN_PUT]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const plan = await prisma.subscriptionPlan.delete({
            where: {
                id: params.id
            }
        })

        return NextResponse.json(plan)
    } catch (error) {
        console.error("[SUBSCRIPTION_PLAN_DELETE]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}
