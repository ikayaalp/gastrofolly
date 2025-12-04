import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import ChefSorClient from "./ChefSorClient"

export default async function ChefSorPage() {
  const session = await getServerSession(authOptions)

  return (
    <ChefSorClient session={session} />
  )
}
