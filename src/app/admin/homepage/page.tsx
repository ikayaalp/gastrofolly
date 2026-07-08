import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { resolveHomeSections } from "@/lib/homeSections"
import HomepageManagerClient from "@/components/admin/HomepageManagerClient"

export const dynamic = "force-dynamic"

export default async function AdminHomepagePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [covers, instructors, dbSections] = await Promise.all([
    prisma.homeCover.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.homeInstructor.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.homeSection.findMany(),
  ])

  const sections = resolveHomeSections(dbSections)

  return (
    <HomepageManagerClient
      initialCovers={covers}
      initialInstructors={instructors}
      initialSections={sections}
    />
  )
}
