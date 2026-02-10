import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Premium Üyelik",
    description: "Culinora Premium üyelik planları. Tüm kurslara sınırsız erişim, sertifika desteği ve premium topluluk erişimi.",
}

export default function SubscriptionLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
