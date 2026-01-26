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
  description: "Profesyonel şeflerden gastronomi öğrenin. Video dersler, uygulamalı projeler ve sertifikalar.",
  keywords: ["Culinora", "gastronomi", "yemek", "kurs", "şef", "mutfak", "online eğitim"],
  openGraph: {
    title: "Culinora - Gastronomi Kursları",
    description: "Profesyonel şeflerden gastronomi öğrenin.",
    url: "https://culinora.net",
    siteName: "Culinora",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Culinora - Gastronomi Kursları",
    description: "Profesyonel şeflerden gastronomi öğrenin.",
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
  return (
    <html lang="tr">
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
