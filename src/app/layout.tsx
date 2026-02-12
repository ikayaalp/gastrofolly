import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MobileNavbar from "@/components/layout/MobileNavbar";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://culinora.net"),
  title: {
    default: "Culinora - Gastronomi Kursları",
    template: "%s | Culinora",
  },
  description: "Profesyonel şeflerden sertifikalı gastronomi ve aşçılık kursları. Video dersler, uygulamalı projeler ve kariyer odaklı eğitimlerle mutfakta ustalaşın.",
  keywords: ["Culinora", "gastronomi", "edtech", "online kurs", "aşçılık eğitimi", "şef eğitimi", "sertifikalı yemek kursları", "mutfak okulu"],
  icons: {
    icon: "/logo.jpeg",
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  openGraph: {
    title: "Culinora - Gastronomi Kursları",
    description: "Profesyonel şeflerden sertifikalı gastronomi kursları.",
    url: "https://culinora.net",
    siteName: "Culinora",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "https://culinora.net/logo.jpeg",
        width: 800,
        height: 600,
        alt: "Culinora Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Culinora - Gastronomi Kursları",
    description: "Profesyonel şeflerden sertifikalı gastronomi kursları.",
    images: ["https://culinora.net/logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  // JSON-LD for Organization and Course
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Culinora",
    "url": "https://culinora.net",
    "logo": "https://culinora.net/logo.jpeg", // Ensure this exists or update path
    "description": "Profesyonel şeflerden sertifikalı online gastronomi eğitimi platformu.",
    "sameAs": [
      "https://www.instagram.com/culinora", // Placeholder - user should verify
    ]
  };

  return (
    <html lang="tr">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}


        <AuthSessionProvider>
          <CartProvider>
            <FavoritesProvider>
              {children}
            </FavoritesProvider>
          </CartProvider>
          <MobileNavbar initialSession={session} />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
