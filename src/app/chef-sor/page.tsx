import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import ChefSorClient from "./ChefSorClient"

export const metadata: Metadata = {
  title: "Şefe Sor",
  description: "Profesyonel şeflere sorularınızı sorun, mutfak teknikleri ve tarifler hakkında uzman görüşü alın.",
  alternates: {
    canonical: "/chef-sor",
  },
}

export default async function ChefSorPage() {
  const session = await getServerSession(authOptions)

  return (
    <ChefSorClient session={session} />
  )
}
