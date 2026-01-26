import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Culinora - Gastronomi Kursları",
  description: "Profesyonel şeflerden sertifikalı online gastronomi ve aşçılık kursları. Video dersler, uygulamalı projeler ve kariyer odaklı eğitimlerle mutfakta ustalaşın.",
  keywords: ["Culinora", "gastronomi", "edtech", "online kurs", "aşçılık eğitimi", "şef eğitimi", "sertifikalı yemek kursları", "mutfak okulu"],
  openGraph: {
    title: "Culinora - Gastronomi Kursları",
    description: "Profesyonel şeflerden sertifikalı gastronomi kursları.",
    url: "https://culinora.net",
    siteName: "Culinora",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Culinora - Gastronomi Kursları",
    description: "Profesyonel şeflerden sertifikalı online gastronomi kursları.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD for Organization and Course
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Culinora",
    "url": "https://culinora.net",
    "logo": "https://culinora.net/logo.png", // Ensure this exists or update path
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
        </AuthSessionProvider>
      </body>
    </html>
  );
}
