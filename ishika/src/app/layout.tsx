import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ISHIKA'S WORLD — Where Creativity Meets Luxury",
  description:
    "A premium creator destination for exclusive video content, curated merchandise, membership experiences, and an intimate community.",
  keywords: "ISHIKA'S WORLD, creator platform, exclusive content, premium membership, merchandise",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <UserProvider>
          <CartProvider>
            <Header />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <Footer />
            <MobileNav />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
