import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "China Product Discovery & Sourcing Platform | Direct B2B Quotations",
  description:
    "Discover manufactured products from China across industrial equipment, electronics, vehicles, and commercial goods. Request factory direct export quotations and custom sourcing services.",
  keywords: [
    "China product sourcing",
    "China product discovery",
    "B2B export quotation",
    "China manufacturing sourcing",
    "OEM ODM China sourcing",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
