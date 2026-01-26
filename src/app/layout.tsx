import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
  keywords: ["gastronomi", "yemek", "kurs", "şef", "mutfak", "online eğitim"],
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
