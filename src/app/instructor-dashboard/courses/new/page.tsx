import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NewCourseClient from "./NewCourseClient"

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })
  return categories
}

export default async function NewCourse() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  const categories = await getCategories()

  return (
    <NewCourseClient
      categories={categories}
      session={session}
    />
  )
}
