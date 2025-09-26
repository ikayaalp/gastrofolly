import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import CartIcon from "@/components/ui/CartIcon";
import Header from "@/components/ui/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Chef2.0 - Gastronomi Kursları",
  description: "Profesyonel şeflerden gastronomi öğrenin. Video dersler, uygulamalı projeler ve sertifikalar.",
  keywords: ["gastronomi", "yemek", "kurs", "şef", "mutfak", "online eğitim"],
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
              <Header />
              {children}
              <CartIcon />
            </FavoritesProvider>
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
